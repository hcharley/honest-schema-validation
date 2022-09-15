// you can choose to do this challenge in whichever
// language you're most comfortable with.

//@ts-ignore
const chai = require('chai');

// TODO: Remove this
//@ts-ignore
const exports = 'Never use me';


/**
 * Types
 */

type Cls = {
  // constructor: Function
}
type Data = any;
interface Schema {

}
interface Result {
  passed: boolean;
  messages?: string[];
}

type Mock = {
  name: string;
  data: Data;
  schema: Schema;
  result: Result;
}

/** 
 * Constants
 */

const ERROR_MESSAGES = {
  SuccessValidationResultsHaveNoMessages:
    'Succesful validation results should not have any messages'
}

/**
 * Utilities
 */

// const getConstructorName = (cls: Cls): string => {
//   return cls.constructor.name;
// }


/**
 * Classes
 */

class ValidationError extends Error { }

/* Validators */

class Validator {
  public static type: string;
  public type!: string;

  constructor(public data: any) { }

  get typeOfData() {
    return typeof this.data
  }

  public performValidationOfTypeOf = true;

  public validate() {
    if (this.performValidationOfTypeOf) {
      this.validateTypeOf();
    }
  }

  public runValidation() { }

  validateTypeOf() {
    if (this.typeOfData !== this.type) {
      throw new ValidationError(
        `${this.typeOfData} is not the expected type of ${this.type}`
      );
    }
  }
}

class ObjectValidator extends Validator {
  public static type = 'object';
  public type = 'object';

  public runValidation() {
    // super.validate();
  }
}

class NumberValidator extends Validator {
  public static type = 'number';
  public type = 'number';
}

class StringValidator extends Validator {
  public static type = 'string';
  public type = 'string';
}

class BooleanValidator extends Validator {
  public static type = 'boolean';
  public type = 'boolean';
}

class ArrayValidator extends Validator {
  public static type = 'array';
  public type = 'array';
}

class OneOfValidator extends Validator {
  public static type = 'oneOf';
  public type = 'oneOf';
}

// TODO: Fix as any
const getValidatorClass = (data: any): { new(data: any): Validator } => {
  switch (typeof data) {
    case NumberValidator.type:
      return NumberValidator as any;
    case StringValidator.type:
      return StringValidator as any;
    case ObjectValidator.type:
      return ObjectValidator as any;
    case BooleanValidator.type:
      return BooleanValidator as any;
    case ArrayValidator.type:
      return ArrayValidator as any;
    case OneOfValidator.type:
      return OneOfValidator as any;
    default:
      throw new Error(`Unexpected type of data: ${typeof data}`)
  }
}

const getValidator = (data: any) => {
  const cls = getValidatorClass(data);
  return new cls(data);
}

/* Results */

class ValidationResult implements Result {
  public messages?: string[];

  constructor(
    public passed: boolean = false,
    messages?: string[],
  ) {
    if (messages && !(messages instanceof Array)) {
      throw new Error('Messages must be an array');
    }


    if (passed && messages) {
      throw new Error(`Succesful validation results should not have any messages`);
    }

    if (messages && messages.length === 0) {
      throw new Error(`Any result with a message array should have at least one message.`);
    } else if (messages) {
      this.addMessages(...messages);
    }
  }

  validateAndNormalizeMessage(message: string) {
    if (typeof message !== 'string') {
      throw new Error(`Message being added to result is a "${typeof message}" not a string`);
    }

    const normalizedMessage = message.trim();

    if (normalizedMessage.length === 0) {
      throw new Error(`Message being added to result is an empty string: ${message}`);
    }

    return normalizedMessage;
  }

  addMessage(message: string) {
    const normalizedMessage = this.validateAndNormalizeMessage(message);

    if (!this.messages) {
      this.messages = [normalizedMessage];
    } else {
      this.messages.push(normalizedMessage);
    }
  }

  addMessages(...messages: string[]) {
    for (const message of messages) {
      this.addMessage(message);
    }
  }

  toJSON(): Result {
    return {
      passed: this.passed,
      messages: this.messages,
    }
  }
}

class SuccessfulValidationResult extends ValidationResult {
  constructor() {
    super(true);
  }
}

class FailedValidationResult extends ValidationResult {
  constructor(messages: string[]) {
    super(false, messages);

    if (!this.messages?.length) {
      throw new Error(`All failed validations should have some messages. (${messages})`);
    }
  }
}

/* Test for Result class */
const MOCK_RESULT = new ValidationResult();
chai.expect(MOCK_RESULT.messages).to.not.exist;
MOCK_RESULT.addMessage('foobar');
chai.expect(MOCK_RESULT.messages).to.exist;
chai.assert(
  MOCK_RESULT.messages![0] === 'foobar',
  'Mock result message of "foobar" was not saved'
);

// TODO: Change the 'any'
const runTestForValidationResult = (cls: any = ValidationResult, {
  name = cls.constructor.name,
  expectError = true,
  passed = true,
  messages = ['I have messages'],
},
  args: any[] = [passed, messages]
) => {
  let failed = false;

  // https://stackoverflow.com/questions/44832316/variable-test-is-used-before-being-assigned-typescript
  let result!: ValidationResult;
  let cause!: Error;

  try {
    result = new cls(...args);
  } catch (error) {
    failed = true;
    cause = error as Error;
  } finally {
    if (cause) {
      if (!expectError) {
        console.error(`Throwing error for ${name} test:`);
        if (result) {
          console.error(result.toJSON());
        }
        throw cause;
      }
      chai.assert(cause instanceof Error);
      const expectedMessage = ERROR_MESSAGES.SuccessValidationResultsHaveNoMessages;
      const error = (cause as Error);
      chai.assert(
        error.message === expectedMessage,
        `${name}: Incorrect error message:\n\n${error.message}\n\nIt should have been:\n\n${expectedMessage}`
      );
    } else if (expectError && failed === false) {
      const shhhhh = true;
      const isWorking = false;
      const message = `${name}: This state never should have been reached, because an error should have been thrown when ${name} was created.`;
      if (isWorking) {
        throw new Error(message);
      } else if (!shhhhh) {
        console.warn(message);
      }
    }
  }

}

runTestForValidationResult(ValidationResult, {
  name: 'ValidationResult',
  expectError: true,
  passed: true,
});
runTestForValidationResult(SuccessfulValidationResult, {
  name: 'SuccessfulValidationResult',
  expectError: true,
  passed: true
}, []);
runTestForValidationResult(FailedValidationResult, {
  name: 'FailedValidationResult',
  expectError: false,
  passed: false,
}, [
  ['This is a message of failure']
]);



/**
 * Validate Schema
 */

const validateSchema = (data: Data, schema: Schema): Result => {
  const validator = getValidator(data);


  // https://stackoverflow.com/questions/44832316/variable-test-is-used-before-being-assigned-typescript
  let result!: ValidationResult;

  try {
    validator.validate();
  } catch (cause) {
    if (cause instanceof ValidationError) {
      result = new FailedValidationResult([cause.message]);
    } else {
      result = new ValidationResult(false, [
        'Unknown validation error'
      ]);
    }
  }

  if (!result) {
    result = new SuccessfulValidationResult();
  }

  return result.toJSON();
}


/**
 * Tests
 */

const MOCKS: Mock[] = [
  {
    name: 'First and last name example',
    data: { "names": [{ "first": "John", "last": 5 }] },
    schema: {
      "type": "object",
      "properties": {
        "names": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "first": { "type": "string" },
              "last": { "type": "string" }
            },
            "required": ["first", "last"]
          }
        }
      },
      "required": ["name"]
    },
    result: {
      passed: false,
      messages: [
        'Expected type "string" but received type "number" at path "names[0].last"'
      ],
    }
  },
  {
    name: 'Any string should do',
    schema: {
      "type": "string"
    },
    result: {
      passed: true,
    },
    data: 'hello world!',
  },
  {
    name: 'Any string of numbers should do',
    schema: {
      "type": "string"
    },
    result: {
      passed: true,
    },
    data: '1234',
  },
  {
    name: 'Non-string numbers should not do',
    schema: {
      "type": "string"
    },
    result: {
      passed: false,
    },
    data: 5
  },
  {
    name: 'Non-string booleans should not do',
    schema: {
      "type": "string"
    },
    result: {
      passed: false,
    },
    data: false
  },
  {
    name: 'Non-string nulls should not do',
    schema: {
      "type": "string"
    },
    result: {
      passed: false,
    },
    data: null
  },
  {
    name: 'Non-string undefineds should not do',
    schema: {
      "type": "string"
    },
    result: {
      passed: false,
    },
    data: undefined
  },
  {
    name: 'Non-string objects should not do',
    schema: {
      "type": "string"
    },
    result: {
      passed: false,
    },
    data: { "name": "hello" }
  },
];

let index = 0;
for (const mock of MOCKS) {
  index++;

  const result = validateSchema(mock.data, mock.schema);

  if (mock.result.messages?.length) {
    let messageIndex = 0;
    if (result.passed) {
      continue;
    }
    for (const mockMessage of mock.result.messages) {
      if (!result.messages) {
        throw new Error(`Validation of Mock #${index} (${mock.name}) has no messages`)
      }
      const resultMessage = result.messages![messageIndex];

      messageIndex++;

      chai.assert(
        mockMessage === resultMessage,
        `Validation of Mock #${index} (${mock.name}) had an unexpected message #${messageIndex}/${result.messages!.length} of "${resultMessage}" when it should have been:\n\n${mockMessage}\n`
      );
    }
  } else {
    chai.expect(result.messages).to.not.exist;
  }

  chai.assert(
    result.passed === mock.result.passed,
    `Validation of Mock #${index} (${mock.name}) was unexpectedly "${result.passed}" when it should have been "${mock.result.passed}".`
  );

  console.log(result);
}


/**
 * Exports
 */

module.exports = {
  validateSchema,
}