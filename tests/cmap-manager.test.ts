import { CmapManager } from '../src';

const DummyTriples: Array<[string, string, string]> = [
  ["This", "or", "That"],
  ["This", "cannot", "Be"],
  ["Be", "rhymes with", "Bee"]
]

test('create new cmap-manager', () => {
  const result = new CmapManager();
  expect(result.getNodes()).toHaveLength(0);
});

test('add node', () => {
  const cm = new CmapManager();
  cm.commitAction(["add node", {type: "concept", value: "Test"}])

  expect(cm.getNodes()).toHaveLength(1);
  expect(cm.getNodes()[0].value).toBe("Test")
})

test('add triple', () => {
  const cm = new CmapManager();
  cm.addTriple(["John", "mows", "the lawn"])

  expect(cm.getNodes()).toHaveLength(3);
  expect(cm.getLog()).toHaveLength(1);
  expect(cm.getLog().pop()).toHaveLength(6);
})

test('load triples', () => {
  const cm = new CmapManager();

  cm.loadTriples(DummyTriples)

  expect(cm.getNodes()).toHaveLength(7);
  expect(cm.getLinks()).toHaveLength(6);
  expect(cm.getTriples()).toHaveLength(3);
})


test('compare load to add triples', () => {
  const toTripleString = t => t.value.join();
  const cm1 = new CmapManager();
  const cm2 = new CmapManager();

  cm1.loadTriples(DummyTriples);
  cm2.addTriples(DummyTriples);

  expect(cm1.getNodes().length).toEqual(cm2.getNodes().length)
  expect(cm1.getLinks().length).toEqual(cm2.getLinks().length)
  expect(cm1.getTriples().length).toEqual(cm2.getTriples().length)

  expect(cm1.getNodes().map(n => n.value).sort()).toEqual(cm2.getNodes().map(n => n.value).sort())
  expect(cm1.getTriples().map(toTripleString).sort()).toEqual(cm2.getTriples().map(toTripleString).sort())
})