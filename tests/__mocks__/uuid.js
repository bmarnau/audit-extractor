// Mock uuid for Jest
let counter = 0;

function generateValidV4UUID() {
  counter++;
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where y is one of [8, 9, a, b]
  const segments = [
    Math.random().toString(16).slice(2, 10),
    Math.random().toString(16).slice(2, 6),
    '4' + Math.random().toString(16).slice(2, 5),
    ['8', '9', 'a', 'b'][Math.floor(Math.random() * 4)] +
      Math.random().toString(16).slice(2, 5),
    Math.random().toString(16).slice(2, 14)
  ];
  return segments.join('-');
}

module.exports = {
  v4: jest.fn(generateValidV4UUID),
  validate: jest.fn((uuid) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)),
  version: jest.fn((uuid) => 4),
  NIL: '00000000-0000-0000-0000-000000000000'
};
