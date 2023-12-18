// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const hashString = async (text: string) => {
  let success = false;

  const replacementList = [
    {
      key: 'a',
      with: '1',
    },
    {
      key: 'A',
      with: 'a',
    },
    {
      key: 'b',
      with: '2',
    },
    {
      key: 'B',
      with: 'b',
    },
    {
      key: 'c',
      with: '3',
    },
    {
      key: 'C',
      with: 'c',
    },
    {
      key: 'd',
      with: '4',
    },
    {
      key: 'D',
      with: 'd',
    },
    {
      key: 'e',
      with: '5',
    },
    {
      key: 'E',
      with: 'e',
    },
    {
      key: 'f',
      with: '6',
    },
    { key: 'F', with: 'f' },
    {
      key: 'g',
      with: '7',
    },
    {
      key: 'G',
      with: 'g',
    },
    {
      key: 'h',
      with: '8',
    },
    { key: 'H', with: 'h' },
    { key: 'i', with: '9' },
    { key: 'I', with: 'i' },
    { key: 'j', with: '+' },
    { key: 'J', with: 'j' },
    { key: 'k', with: '=' },
    { key: 'K', with: 'k' },
    { key: 'l', with: '0' },
    { key: 'L', with: 'l' },
    { key: 'm', with: '>' },
    { key: 'M', with: 'm' },
    { key: 'n', with: '<' },
    { key: 'N', with: 'n' },
    { key: 'o', with: '|' },
    { key: 'O', with: 'o' },
    { key: 'p', with: ':' },
    { key: 'P', with: 'p' },
    { key: 'q', with: ';' },
    { key: 'Q', with: 'q' },
    { key: 'r', with: '،' },
    { key: 'R', with: 'r' },
    { key: 's', with: '☻' },
    { key: 'S', with: 's' },
    { key: 't', with: '├' },
    { key: 'T', with: 't' },
    { key: 'u', with: 'Ö' },
    { key: 'U', with: 'u' },
    { key: 'v', with: 'Ü' },
    { key: 'V', with: 'v' },
    { key: 'w', with: 'Æ' },
    { key: 'W', with: 'w' },
    { key: 'x', with: '"' },
    { key: 'X', with: 'x' },
    { key: 'y', with: '~' },
    { key: 'Y', with: 'y' },
    { key: 'z', with: '╚' },
    { key: 'Z', with: 'z' },
    { key: ',', with: '.' },
    { key: '[', with: '#' },
    { key: ']', with: '#' },
  ];

  const newText = text.split(',');
  let hashedText = '';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const elm of newText) {
    const newWord = text.split('');
    for await (const nw of newWord) {
      const selectedIndex = replacementList.find((el) => el.key == nw);

      if (selectedIndex) {
        if (nw !== ',') {
          hashedText = hashedText + selectedIndex.with;
        } else {
          hashedText = hashedText + '.';
        }
      }
    }
  }

  success = true;
  return {
    success,
    hashedText: String(hashedText),
  };
};
