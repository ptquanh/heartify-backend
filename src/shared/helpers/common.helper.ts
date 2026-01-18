export const maskRules = [
  {
    keys: ['nationalId', 'phone', 'phoneNumber', 'address'],
    pattern: /^(.*)$/,
    replacer: () => '***masked***',
  },
];

export const extractUniqueValues = <T>(data: T[], identifier: keyof T) => {
  return Array.from(new Set(data.map((item) => item[identifier] as string)));
};
