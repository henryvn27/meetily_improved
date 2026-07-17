const appearances = ['Light', 'Dark'];
const releaseSizes = [[1280, 820], [1100, 720]];

export const releaseVisualMatrix = Object.freeze(
  releaseSizes.flatMap(([width, height]) => appearances.map((appearance) => Object.freeze({
    appearance,
    width,
    height,
  }))),
);
