import argon2 from "argon2";
import "./env.js";

const pepperString = process.env.PEPPER;
const pepper = pepperString ? Buffer.from(pepperString, "utf-8") : undefined;

const argon2Options = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  hashLength: 50,
  timeCost: 3,
  secret: pepper,
};

export { argon2Options, pepper };
