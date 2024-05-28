import { CmapManager } from '../src';

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

  cm.loadTriples([
    ["This", "or", "That"],
    ["This", "cannot", "Be"],
    ["Be", "rhymes with", "Bee"],
    ["That", "is external to", "This"],
    ["Be", "ever over", "That"],
  ])

  expect(cm.getNodes()).toHaveLength(9);
  expect(cm.getLinks()).toHaveLength(10);
  expect(cm.getTriples()).toHaveLength(5);
})