import _ from 'lodash';

/**
 * Stack datastructure to perform required operations -
 * push, pop, peek, empty to perform arithmatic/logical operaitons
 *
 * Adding new operator to be supported
 *  1. Add the symbol/keyword of operation in allowedOps array
 *  2. Add new 'case' in the switch present inside the method for newly added operator applyOp
 *  3. If required, decide the precendence inside the method hasPrecedence
 *
 */

class Stack {
  constructor() {
    this.top = -1;
    this.items = [];
  }

  push(item) {
    const idx = this.top;
    this.items[idx + 1] = item;
    this.top = idx + 1;
  }

  pop() {
    const popIdx = this.top;
    const item = this.items[popIdx];
    this.top = popIdx - 1;
    return item;
  }

  peek() {
    return this.items[this.top];
  }

  empty() {
    if (this.top === -1) { return true; }
    return false;
  }
}
/* eslint quote-props: ["error", "always"] */
const precedence = {
  '(': 8,
  ')': 8,

  '!': 7,

  '^': 6,

  '*': 5,
  '/': 5,

  '+': 4,
  '-': 4,

  'contains': 3,
  'hasLength': 3,
  '>': 3,
  '<': 3,

  '==': 2,
  '!=': 2,

  '&&': 1,
  '||': 1,
};

/**
 * ex - 4 * 5 - 2
 * @param opStackTop peeked from ops
 * @param currentOp found in the expression
 *
 * TODO implementation could be more precise and can be based on JS operator precedence values
 *      see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
 *
 * @returns true if 'opStackTop' has higher or same precedence as 'currentOp',
 * otherwise returns false
 */
function hasPrecedence(currentOp, opStackTop) {
  if (opStackTop === '(' || opStackTop === ')') { return false; }
  return precedence[opStackTop] >= precedence[currentOp];
}
/**
 * A utility method to apply an operation 'op' on operands
 * @param op operator
 * @param b operand
 * @param a operand
 *
 * @returns result of operation applied
 */
function applyOp(op, b, a) {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      // should we handle the case of b == 0 ?
      return a / b;
    case '==':
      return a === b;
    case '!=':
      return a !== b;
    case '&&':
      return a && b;
    case '||':
      return a || b;
    case '>':
      return a > b;
    case '<':
      return a < b;
    case '!':
      return !b;
    case 'contains': {
      try {
        const bJSON = JSON.parse(b);
        return _.some(a || [], bJSON);
      } catch (e) {
        return (a || []).indexOf(b) > -1;
      }
    }
    case 'hasLength':
      return (a || []).length === b;
  }
  return 0;
}

// list of operations allowed by the parser
const allowedOps = ['+', '-', '*', '/', '==', '!=', '&&', '||', '>', '<', 'contains', 'hasLength', '!'];
// operators that work only with one param
const oneParamOps = ['!'];

// will split expression into tokens mainly using spaces
// additionally we let "(", ")", "!" to be used without spaces around
// for "!" we check that next symbol is not "=", to avoid splitting "!="
const opsSplitters = ['\\s+', '\\(', '\\)', '!(?!=)'];
const splitRegexp = new RegExp(`(${opsSplitters.join('|')})`);

/**
 * Javascript parser to parse the logical/arithmetic opertaion provided
 * this is based on javascript implementation of "Shunting Yard Algo"
 *
 * @param expression an expression to be evaluated
 * @param data data json to fetch the operands value
 *
 * @returns true, if the expression evaluates to true otherwise false
 *
 */
export function evaluate(expression, data) {
  const tokens = expression
    .split(splitRegexp)
    // remove unnecessary spaces around tokens
    .map(token => token.trim())
    // remove empty tokens
    .filter(token => token !== '');

  // Stack for operands: 'values'
  const values = new Stack();

  // Stack for Operators: 'ops'
  const ops = new Stack();

  // Keep track of unbalanced parenthesis
  const unbalancedParens = [];

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === '(') {
      ops.push(tokens[i]);
      unbalancedParens.push(i);

      // Closing brace encountered, solve expression since the last opening brace
    } else if (tokens[i] === ')') {
      while (ops.peek() !== '(' && !ops.empty()) {
        const op = ops.pop();
        if (oneParamOps.indexOf(op) !== -1) {
          values.push(applyOp(op, values.pop()));
        } else {
          values.push(applyOp(op, values.pop(), values.pop()));
        }
      }
      // if the ops array is empty means there is an unbalanced closing parenthesis
      if (ops.empty()) {
        unbalancedParens.push(i);
      } else {
        unbalancedParens.pop();
        ops.pop(); // removing opening brace
      }

      // Current token is an operator.
    } else if (allowedOps.indexOf(tokens[i]) > -1) {
      /**
       * While top of 'ops' has same or greater precedence to current token,
       * Apply operator on top of 'ops' to top two elements in values stack
       */
      while (!ops.empty() && hasPrecedence(tokens[i], ops.peek())) {
        const op = ops.pop();
        if (oneParamOps.indexOf(op) !== -1) {
          values.push(applyOp(op, values.pop()));
        } else {
          values.push(applyOp(op, values.pop(), values.pop()));
        }
      }

      // Push current token to ops
      ops.push(tokens[i]);
    } else {
        if (tokens[i] == 'null') {
          values.push(null);
        } else if (tokens[i] == 'undefined') {
          values.push(undefined);
        } else if (tokens[i] == 'true') {
          values.push(true);
        } else if (tokens[i] == 'false') {
          values.push(false);
        } else if (!isNaN(tokens[i])) {
          values.push(parseInt(tokens[i]));
        } else if (tokens[i].match(/^\'.*\'$/)) {
          // removing single quotes around the text values
          let literal = tokens[i].replace(/'/g, '');
          // literal = literal === 'true' || (literal === 'false' ? false : literal);
          values.push(literal);
        } else {
          values.push(_.get(data, tokens[i]));
        }
    }
  }

  // if there are unbalanced parenthesis throw an error
  if (unbalancedParens.length !== 0) {
    throw new Error(`Parens with the following token indexes are unbalanced: ${unbalancedParens}`);
  }

  // debugger
  // Parsed expression tokens are pushed to values/ops respectively,
  // Running while loop to evaluate the expression
  while (!ops.empty()) {
    const op = ops.pop();
    if (oneParamOps.indexOf(op) !== -1) {
      values.push(applyOp(op, values.pop()));
    } else {
      values.push(applyOp(op, values.pop(), values.pop()));
    }
  }
  // Top contains result, return it
  return values.pop();
}

/**
 * Parses expression to find variable names in format of domain name:
 * string1.string2.string3 and so on. Minimum one dot "." is required.
 *
 * TODO this should be improved as we can have variables without "." like "name" for project name
 *
 * @param {String} expression expression
 *
 * @returns {Array} list of variable names
 */
export function getFieldNamesFromExpression(expression) {
  const re = /([a-z]+[a-z0-9]*(?:\.[a-z]+[a-z0-9]*)+)/ig;
  let match;
  const fieldNames = [];

  do {
    match = re.exec(expression);
    if (match) {
      fieldNames.push(match[1]);
    }
  } while (match);

  return fieldNames;
}

/**
 * Replace prepared conditions inside expression
 *
 * @example
 *   const expression = 'preparedCondition1 == 1'
 *   const preparedConditions = {
 *     preparedCondition1: '(2 - 1)'
 *   }
 *
 *   const output = populatePreparedConditions(expression, preparedConditions)
 *
 *   // output => '(2 - 1) == 1'
 *
 * @param {String} expression         expression
 * @param {Object} preparedConditions prepared conditions
 *
 * @returns {String} expression
 */
export function populatePreparedConditions(expression, preparedConditions) {
  // in the Regexp we describe situations when preparedCondition can be replaced,
  // instead of defining situations when it cannot be replaced
  const allowedBefore = ['^', '\\s', '\\(', '!'].join('|');
  const allowedAfter = ['$', '\\s', '\\)'].join('|');

  preparedConditions && _.forEach(preparedConditions, (value, key) => {
    // as JS RegExp doesn't support lookbehind, we use some workaround here
    const regex = new RegExp(`(${allowedBefore})${key}(?=${allowedAfter})`, 'g');
    expression = expression.replace(regex, `$1${value}`);
  });

  return expression;
}
