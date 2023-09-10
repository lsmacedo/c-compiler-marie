import { parseExpression, parseValue } from "../../parse";
import { Value } from "../../types";

describe("parseValue", () => {
  describe("macro", () => {
    it("should replace macro with its defined literal value", () => {
      parseExpression("#define true 1");

      const value = "true";
      const parsed = parseValue(value);

      const expected: Value = {
        literal: 1,
      };
      expect(parsed).toEqual(expected);
    });
  });

  describe("literal value", () => {
    it("should parse integer", () => {
      const value = "42";
      const parsed = parseValue(value);

      const expected: Value = {
        literal: 42,
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse char", () => {
      const value = "'4'";
      const parsed = parseValue(value);

      const expected: Value = {
        literal: 52,
      };
      expect(parsed).toEqual(expected);
    });
  });

  describe("array initializer", () => {
    const LUCAS_STRING_ARRAY = [
      { literal: 76 },
      { literal: 117 },
      { literal: 99 },
      { literal: 97 },
      { literal: 115 },
      { literal: 0 },
    ];

    it("should parse string", () => {
      const value = '"Lucas"';
      const parsed = parseValue(value);

      const expected: Value = { elements: LUCAS_STRING_ARRAY };
      expect(parsed).toEqual(expected);
    });

    it("should parse brace-enclosed list", () => {
      // As a temporary fix for a bug, the parser currently replaces curly
      // brackets with brackets before parsing values
      const value = "[ 1, myvariable, 'x', \"Lucas\" ]";
      const parsed = parseValue(value);

      const expected: Value = {
        elements: [
          { literal: 1 },
          {
            variable: "myvariable",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
          { literal: 120 },
          { elements: LUCAS_STRING_ARRAY },
        ],
      };
      expect(parsed).toEqual(expected);
    });
  });

  describe("variable", () => {
    it("should parse variable", () => {
      const value = "myvariable";
      const parsed = parseValue(value);

      const expected: Value = {
        variable: "myvariable",
        arrayPosition: undefined,
        isAddressOperation: false,
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse variable at address position", () => {
      const value = "myvariable[3]";
      const parsed = parseValue(value);

      const expected: Value = {
        variable: "myvariable",
        arrayPosition: { literal: 3 },
        isAddressOperation: false,
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse pointer to variable", () => {
      const value = "&myvariable";
      const parsed = parseValue(value);

      const expected: Value = {
        variable: "myvariable",
        arrayPosition: undefined,
        isAddressOperation: true,
      };
      expect(parsed).toEqual(expected);
    });
  });

  describe("function call", () => {
    it("should parse function call without parameters", () => {
      const value = "myfunction()";
      const parsed = parseValue(value);

      const expected: Value = {
        functionCall: {
          name: "myfunction",
          params: [],
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse function call with parameters", () => {
      const value = 'myfunction(123, x, "str")';
      const parsed = parseValue(value);

      const expected: Value = {
        functionCall: {
          name: "myfunction",
          params: [
            { literal: 123 },
            {
              variable: "x",
              isAddressOperation: false,
              arrayPosition: undefined,
            },
            {
              elements: [
                { literal: 115 },
                { literal: 116 },
                { literal: 114 },
                { literal: 0 },
              ],
            },
          ],
        },
      };
      expect(parsed).toEqual(expected);
    });
  });

  describe("logical expression", () => {
    it("should parse AND expression", () => {
      const value = "ptr && ptr != 5";
      const parsed = parseValue(value);

      const expected: Value = {
        expression: {
          firstOperand: {
            variable: "ptr",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
          operator: "&&",
          secondOperand: {
            expression: {
              firstOperand: {
                variable: "ptr",
                isAddressOperation: false,
                arrayPosition: undefined,
              },
              operator: "!=",
              secondOperand: { literal: 5 },
            },
          },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse OR expression", () => {
      const value = "value || 999";
      const parsed = parseValue(value);

      const expected: Value = {
        expression: {
          firstOperand: {
            variable: "value",
            arrayPosition: undefined,
            isAddressOperation: false,
          },
          operator: "||",
          secondOperand: { literal: 999 },
        },
      };
      expect(parsed).toEqual(expected);
    });

    describe("expression order", () => {
      it("should parse order as (a && b) && c", () => {
        const value = "0 && 1 && 2";
        const parsed = parseValue(value);

        const expected: Value = {
          expression: {
            firstOperand: {
              expression: {
                firstOperand: { literal: 0 },
                operator: "&&",
                secondOperand: { literal: 1 },
              },
            },
            operator: "&&",
            secondOperand: { literal: 2 },
          },
        };
        expect(parsed).toEqual(expected);
      });

      it("should parse order as (a && b) || c", () => {
        const value = "0 && 1 || 2";
        const parsed = parseValue(value);

        const expected: Value = {
          expression: {
            firstOperand: {
              expression: {
                firstOperand: { literal: 0 },
                operator: "&&",
                secondOperand: { literal: 1 },
              },
            },
            operator: "||",
            secondOperand: { literal: 2 },
          },
        };
        expect(parsed).toEqual(expected);
      });

      it("should parse order as (a || b) || c", () => {
        const value = "0 || 1 || 2";
        const parsed = parseValue(value);

        const expected: Value = {
          expression: {
            firstOperand: {
              expression: {
                firstOperand: { literal: 0 },
                operator: "||",
                secondOperand: { literal: 1 },
              },
            },
            operator: "||",
            secondOperand: { literal: 2 },
          },
        };
        expect(parsed).toEqual(expected);
      });

      it("should parse order as a || (b && c)", () => {
        const value = "0 || 1 && 2";
        const parsed = parseValue(value);

        const expected: Value = {
          expression: {
            firstOperand: { literal: 0 },
            operator: "||",
            secondOperand: {
              expression: {
                firstOperand: { literal: 1 },
                operator: "&&",
                secondOperand: { literal: 2 },
              },
            },
          },
        };
        expect(parsed).toEqual(expected);
      });
    });
  });

  describe("relational expression", () => {
    it("should parse EQUAL TO expression", () => {
      const value = "value == 1";
      const parsed = parseValue(value);

      const expected: Value = {
        expression: {
          firstOperand: {
            variable: "value",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
          operator: "==",
          secondOperand: { literal: 1 },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse DIFFERENT FROM expression", () => {
      const value = "value != 1";
      const parsed = parseValue(value);

      const expected: Value = {
        expression: {
          firstOperand: {
            variable: "value",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
          operator: "!=",
          secondOperand: { literal: 1 },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse LESS THAN expression", () => {
      const value = "value < 1";
      const parsed = parseValue(value);

      const expected: Value = {
        expression: {
          firstOperand: {
            variable: "value",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
          operator: "<",
          secondOperand: { literal: 1 },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse LESS THAN OR EQUAL expression", () => {
      const value = "value <= 1";
      const parsed = parseValue(value);

      const expected: Value = {
        expression: {
          firstOperand: {
            variable: "value",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
          operator: "<=",
          secondOperand: { literal: 1 },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse GREATER THAN expression", () => {
      const value = "value > 1";
      const parsed = parseValue(value);

      const expected: Value = {
        expression: {
          firstOperand: {
            variable: "value",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
          operator: ">",
          secondOperand: { literal: 1 },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse GREATER THAN OR EQUAL expression", () => {
      const value = "value >= 1";
      const parsed = parseValue(value);

      const expected: Value = {
        expression: {
          firstOperand: {
            variable: "value",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
          operator: ">=",
          secondOperand: { literal: 1 },
        },
      };
      expect(parsed).toEqual(expected);
    });
  });

  describe("arithmetic expression", () => {
    it("should parse sum", () => {
      const value = "3 + 4";
      const parsed = parseValue(value);

      const expected: Value = {
        expression: {
          firstOperand: { literal: 3 },
          operator: "+",
          secondOperand: { literal: 4 },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse subtraction", () => {
      const value = "3 - 4";
      const parsed = parseValue(value);

      const expected: Value = {
        expression: {
          firstOperand: { literal: 3 },
          operator: "-",
          secondOperand: { literal: 4 },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse multiplication", () => {
      const value = "3 * 4";
      const parsed = parseValue(value);

      const expected: Value = {
        expression: {
          firstOperand: { literal: 3 },
          operator: "*",
          secondOperand: { literal: 4 },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse division", () => {
      const value = "3 / 4";
      const parsed = parseValue(value);

      const expected: Value = {
        expression: {
          firstOperand: { literal: 3 },
          operator: "/",
          secondOperand: { literal: 4 },
        },
      };
      expect(parsed).toEqual(expected);
    });

    describe("expression order", () => {
      it("should parse order as a + (b * c)", () => {
        const value = "0 + 1 * 2";
        const parsed = parseValue(value);

        const expected: Value = {
          expression: {
            firstOperand: { literal: 0 },
            operator: "+",
            secondOperand: {
              expression: {
                firstOperand: { literal: 1 },
                operator: "*",
                secondOperand: { literal: 2 },
              },
            },
          },
        };
        expect(parsed).toEqual(expected);
      });

      it("should parse order as (a * b) + c", () => {
        const value = "0 * 1 + 2";
        const parsed = parseValue(value);

        const expected: Value = {
          expression: {
            firstOperand: {
              expression: {
                firstOperand: { literal: 0 },
                operator: "*",
                secondOperand: { literal: 1 },
              },
            },
            operator: "+",
            secondOperand: { literal: 2 },
          },
        };
        expect(parsed).toEqual(expected);
      });

      it("should parse order as a - (b / c)", () => {
        const value = "0 - 1 / 2";
        const parsed = parseValue(value);

        const expected: Value = {
          expression: {
            firstOperand: { literal: 0 },
            operator: "-",
            secondOperand: {
              expression: {
                firstOperand: { literal: 1 },
                operator: "/",
                secondOperand: { literal: 2 },
              },
            },
          },
        };
        expect(parsed).toEqual(expected);
      });

      it("should parse order as (a / b) - c", () => {
        const value = "0 / 1 - 2";
        const parsed = parseValue(value);

        const expected: Value = {
          expression: {
            firstOperand: {
              expression: {
                firstOperand: { literal: 0 },
                operator: "/",
                secondOperand: { literal: 1 },
              },
            },
            operator: "-",
            secondOperand: { literal: 2 },
          },
        };
        expect(parsed).toEqual(expected);
      });
    });
  });

  describe("prefix", () => {
    it("should parse ++ prefix to variables", () => {
      const value = "++myvariable";
      const parsed = parseValue(value);

      const expected: Value = {
        prefix: {
          operator: "++",
          value: {
            variable: "myvariable",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse -- prefix to variables", () => {
      const value = "--myvariable";
      const parsed = parseValue(value);

      const expected: Value = {
        prefix: {
          operator: "--",
          value: {
            variable: "myvariable",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse - prefix to variables", () => {
      const value = "-x";
      const parsed = parseValue(value);

      const expected: Value = {
        prefix: {
          operator: "-",
          value: {
            variable: "x",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse * prefix to variables", () => {
      const value = "*ptr";
      const parsed = parseValue(value);

      const expected: Value = {
        prefix: {
          operator: "*",
          value: {
            variable: "ptr",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
        },
      };
      expect(parsed).toEqual(expected);
    });
  });

  describe("postfix", () => {
    it("should parse ++ postfix to variables", () => {
      const value = "myvariable++";
      const parsed = parseValue(value);

      const expected: Value = {
        postfix: {
          operator: "++",
          value: {
            variable: "myvariable",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse -- postfix to variables", () => {
      const value = "myvariable--";
      const parsed = parseValue(value);

      const expected: Value = {
        postfix: {
          operator: "--",
          value: {
            variable: "myvariable",
            isAddressOperation: false,
            arrayPosition: undefined,
          },
        },
      };
      expect(parsed).toEqual(expected);
    });
  });
});
