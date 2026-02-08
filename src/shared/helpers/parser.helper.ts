import { FindOptionsOrder } from 'typeorm';

export const parseSort = (
  data: string,
  convertToSnakeCase = false,
  tableAlias?: string,
): FindOptionsOrder<any> => {
  if (!data) {
    return {};
  }

  const sortConditions = data.split(' ');

  return sortConditions.reduce((agg: FindOptionsOrder<any>, data: string) => {
    const isDescending = data[0] === '-';

    if (isDescending) {
      let columnName = data.slice(1, data.length);

      if (convertToSnakeCase) {
        columnName = columnName.replace(/([A-Z])/g, '_$1').toLowerCase();
      }

      if (tableAlias) {
        columnName = `${tableAlias}.${columnName}`;
      }

      agg[columnName] = 'DESC';
    } else {
      agg[data] = 'ASC';
    }

    return agg;
  }, {} as FindOptionsOrder<any>);
};

export const parseCsvLine = (text: string): string[] => {
  const result: string[] = [];
  let curVal = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuote) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          curVal += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        curVal += char;
      }
    } else {
      if (char === '"') {
        inQuote = true;
      } else if (char === ',') {
        result.push(curVal);
        curVal = '';
      } else {
        curVal += char;
      }
    }
  }
  result.push(curVal);
  return result;
};

export const safeJsonParse = (jsonString: string): any => {
  try {
    return jsonString ? JSON.parse(jsonString) : null;
  } catch (_e) {
    return null;
  }
};
