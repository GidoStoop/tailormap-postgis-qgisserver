export enum FilterConditionEnum {
  UNIQUE_VALUES_KEY = 'UNIQUE_VALUES',
  NUMBER_EQUALS_KEY = '=',
  NUMBER_NOT_EQUALS_KEY = '<>',
  NUMBER_LARGER_THAN_KEY = '>',
  NUMBER_SMALLER_THAN_KEY = '<',
  NUMBER_LARGER_EQUALS_THAN_KEY = '>=',
  NUMBER_SMALLER_EQUALS_THAN_KEY = '<=',
  NUMBER_BETWEEN_KEY = '><',
  STRING_EQUALS_KEY = 'EQUALS',
  STRING_LIKE_KEY = 'LIKE',
  STRING_STARTS_WITH_KEY = 'STARTS_WITH',
  STRING_ENDS_WITH_KEY = 'ENDS_WITH',
  DATE_ON_KEY = 'ON',
  DATE_AFTER_KEY = 'AFTER',
  DATE_BEFORE_KEY = 'BEFORE',
  DATE_BETWEEN_KEY = 'BETWEEN',
  BOOLEAN_TRUE_KEY = 'TRUE',
  BOOLEAN_FALSE_KEY = 'FALSE',
  NULL_KEY = 'NULL',
  INTERSECTS = 'INTERSECTS',
}
