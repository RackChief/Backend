// Opt-in API regression check. Creates uniquely named records and removes only those records.
import { randomUUID } from 'node:crypto';

const cookie = process.env.RACKCHIEF_TEST_COOKIE;
if (!cookie) throw new Error('RACKCHIEF_TEST_COOKIE is required');
const base = process.env.RACKCHIEF_API_URL ?? 'http://127.0.0.1:3000/api/v1';
const owned = { assets: [], racks: [], placements: [], ports: [], connections: [] };
const suffix = randomUUID();
async function call(path, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, { method, headers: { Cookie: cookie, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = response.status === 204 ? null : await response.json();
  return { status: response.status, value };
}
function expect(result, status, label) {
  if (result.status !== status) throw new Error(`${label}: expected ${status}, got ${result.status}`);
  return result.value;
}
async function make(path, body, bucket) {
  const value = expect(await call(path, 'POST', body), 201, path);
  bucket.push(value.id);
  return value;
}
try {
  const types = expect(await call('/asset-types'), 200, 'asset types');
  const type = types.find(item => item.slug === 'server') ?? types[0];
  if (!type) throw new Error('No asset types are installed');
  const rack = await make('/racks', { name: `V1 integrity ${suffix}`, totalUnits: 2 }, owned.racks);
  const assets = [];
  for (const name of ['A', 'B', 'C']) assets.push(await make('/assets', { name: `V1 integrity ${suffix} ${name}`, assetTypeId: type.id, rackUnits: 1 }, owned.assets));
  await make(`/racks/${rack.id}/placements`, { assetId: assets[0].id, startUnit: 1 }, owned.placements);
  const candidates = await Promise.all(assets.slice(1).map(asset => call(`/racks/${rack.id}/placements`, 'POST', { assetId: asset.id, startUnit: 2 })));
  owned.placements.push(...candidates.filter(result => result.status === 201).map(result => result.value.id));
  if (candidates.filter(result => result.status === 201).length !== 1 || candidates.filter(result => result.status === 409).length !== 1) throw new Error('Concurrent overlapping placements did not yield one success and one conflict');
  expect(await call(`/assets/${assets[0].id}`, 'PATCH', { rackUnits: 2 }), 409, 'asset resize overlap');
  expect(await call(`/racks/${rack.id}`, 'PATCH', { totalUnits: 1 }), 409, 'rack capacity reduction');
  const ports = [];
  for (let index = 0; index < 3; index++) ports.push(await make(`/assets/${assets[index].id}/ports`, { name: `V1 integrity ${suffix} port`, portType: 'rj45' }, owned.ports));
  const connections = await Promise.all([
    call('/network-connections', 'POST', { portAId: ports[0].id, portBId: ports[1].id }),
    call('/network-connections', 'POST', { portAId: ports[1].id, portBId: ports[2].id }),
  ]);
  owned.connections.push(...connections.filter(result => result.status === 201).map(result => result.value.id));
  if (connections.filter(result => result.status === 201).length !== 1 || connections.filter(result => result.status === 409).length !== 1) throw new Error('Concurrent cross-column port use did not yield one success and one conflict');
  const winner = connections.find(result => result.status === 201).value;
  expect(await call(`/network-connections/${winner.id}`, 'PATCH', { portAId: winner.portBId, portBId: winner.portAId }), 200, 'connection endpoint swap');
  console.log('rack and port integrity checks passed');
} finally {
  for (const id of owned.connections.reverse()) await call(`/network-connections/${id}`, 'DELETE');
  for (const id of owned.ports.reverse()) await call(`/network-ports/${id}`, 'DELETE');
  for (const id of owned.placements.reverse()) {
    const rackId = owned.racks[0];
    await call(`/racks/${rackId}/placements/${id}`, 'DELETE');
  }
  for (const id of owned.racks.reverse()) await call(`/racks/${id}`, 'DELETE');
  for (const id of owned.assets.reverse()) {
    await call(`/assets/${id}/archive`, 'POST');
    await call(`/assets/${id}`, 'DELETE');
  }
}
