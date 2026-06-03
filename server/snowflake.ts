import { Snowflake } from '@sapphire/snowflake'

const EPOCH = new Date('2024-01-01T00:00:00.000Z')
const snowflake = new Snowflake(EPOCH)

const parseMachineId = (value: string | undefined, fallback: bigint): bigint => {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return BigInt(Math.floor(parsed))
}

snowflake.workerId = parseMachineId(process.env.SNOWFLAKE_WORKER_ID, 1n)
snowflake.processId = parseMachineId(process.env.SNOWFLAKE_PROCESS_ID, 1n)

export const generateSnowflakeId = (): string => {
  return snowflake.generate().toString()
}
