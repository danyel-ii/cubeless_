import { z } from "zod";

export const pinRequestSchema = z.object({
  address: z.string(),
  nonce: z.string(),
  signature: z.string(),
  payload: z.record(z.unknown()),
});

export const nftRequestSchema = z.object({
  mode: z.enum(["alchemy", "rpc"]).optional(),
  chainId: z.number().int().positive(),
  path: z.string().optional(),
  query: z.record(z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])).optional(),
  calls: z
    .array(
      z.object({
        to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
        data: z.string().regex(/^0x[0-9a-fA-F]*$/),
      })
    )
    .optional(),
});

export const identityRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export async function readJsonWithLimit(request, maxBytes) {
  const text = await request.text();
  const size = Buffer.byteLength(text, "utf8");
  if (size > maxBytes) {
    const error = new Error("Payload too large");
    error.status = 413;
    error.size = size;
    throw error;
  }
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    const err = new Error("Invalid JSON");
    err.status = 400;
    throw err;
  }
  return { data, size };
}

export function formatZodError(error) {
  return error.issues.map((issue) => issue.message).join("; ");
}
