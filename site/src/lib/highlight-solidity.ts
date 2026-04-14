/**
 * Minimal Solidity grammar for highlight.js / lowlight.
 *
 * Covers keywords, primitive types, FHE-specific encrypted types, modifiers,
 * built-ins, strings, numbers, addresses, and comments — enough to make
 * snippet code blocks readable. Not a full parser.
 */

// highlight.js's LanguageFn signature without pulling the full type package
// into our build. The runtime object passed in exposes `COMMENT`, `QUOTE_STRING_MODE`,
// `C_NUMBER_MODE`, etc.
type HljsApi = {
  COMMENT: (start: string, end: string) => unknown;
  C_LINE_COMMENT_MODE: unknown;
  C_BLOCK_COMMENT_MODE: unknown;
  QUOTE_STRING_MODE: unknown;
  APOS_STRING_MODE: unknown;
  C_NUMBER_MODE: unknown;
};

export function solidity(hljs: HljsApi) {
  const KEYWORDS = [
    "abstract",
    "address",
    "anonymous",
    "as",
    "assembly",
    "break",
    "calldata",
    "catch",
    "constant",
    "constructor",
    "continue",
    "contract",
    "delete",
    "do",
    "else",
    "emit",
    "enum",
    "error",
    "event",
    "external",
    "fallback",
    "false",
    "for",
    "function",
    "if",
    "immutable",
    "import",
    "indexed",
    "initializer",
    "interface",
    "internal",
    "is",
    "library",
    "mapping",
    "memory",
    "modifier",
    "new",
    "override",
    "payable",
    "pragma",
    "private",
    "public",
    "pure",
    "receive",
    "require",
    "return",
    "returns",
    "revert",
    "storage",
    "struct",
    "this",
    "throw",
    "true",
    "try",
    "type",
    "unchecked",
    "using",
    "view",
    "virtual",
    "while",
  ];

  const TYPES = [
    "address",
    "bool",
    "byte",
    "bytes",
    "bytes1",
    "bytes2",
    "bytes4",
    "bytes8",
    "bytes16",
    "bytes32",
    "int",
    "int8",
    "int16",
    "int32",
    "int64",
    "int128",
    "int256",
    "string",
    "uint",
    "uint8",
    "uint16",
    "uint32",
    "uint64",
    "uint128",
    "uint256",
    // FHEVM encrypted types
    "ebool",
    "ebytes64",
    "ebytes128",
    "ebytes256",
    "eaddress",
    "euint4",
    "euint8",
    "euint16",
    "euint32",
    "euint64",
    "euint128",
    "euint256",
    "externalEbool",
    "externalEuint8",
    "externalEuint16",
    "externalEuint32",
    "externalEuint64",
    "externalEuint128",
    "externalEuint256",
  ];

  const BUILT_INS = [
    "msg",
    "block",
    "tx",
    "abi",
    "now",
    "keccak256",
    "sha256",
    "ripemd160",
    "ecrecover",
    "addmod",
    "mulmod",
    "selfdestruct",
    "suicide",
    "blockhash",
    "gasleft",
    "FHE",
  ];

  const LITERALS = ["true", "false", "wei", "gwei", "ether", "seconds", "minutes", "hours", "days", "weeks"];

  return {
    name: "Solidity",
    aliases: ["sol"],
    keywords: {
      keyword: KEYWORDS.join(" "),
      type: TYPES.join(" "),
      built_in: BUILT_INS.join(" "),
      literal: LITERALS.join(" "),
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.APOS_STRING_MODE,
      hljs.C_NUMBER_MODE,
      // Hex literals like 0x1234 and address literals
      {
        className: "number",
        begin: /\b0x[a-fA-F0-9]+\b/,
      },
      // Pragma directive args (e.g. ^0.8.27)
      {
        className: "meta",
        begin: /\^?\d+\.\d+\.\d+/,
      },
      // Function declarations: catch the name
      {
        className: "title",
        beginKeywords: "function event error modifier",
        end: /[({]/,
        excludeEnd: true,
        contains: [
          {
            className: "title",
            begin: /[A-Za-z_$][\w$]*/,
            relevance: 0,
          },
        ],
      },
      // Contract / interface / library / struct / enum names
      {
        className: "class",
        beginKeywords: "contract interface library struct enum",
        end: /[{]/,
        excludeEnd: true,
        contains: [
          {
            className: "title",
            begin: /[A-Za-z_$][\w$]*/,
            relevance: 0,
          },
        ],
      },
    ],
  };
}
