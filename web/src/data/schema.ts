import { z } from "zod";

/** 策略状态。优先级: forbidden > restricted > free */
export const statusSchema = z.enum(["forbidden", "restricted", "free"]);
export type Status = z.infer<typeof statusSchema>;

/** 版权持有方/厂牌（如 lowiro、Rayark）的自身 policy */
export const rightsHolderPolicySchema = z.object({
  name: z.string().min(1),
  status: statusSchema,
  note: z.string().optional(),
});
export type RightsHolderPolicy = z.infer<typeof rightsHolderPolicySchema>;

/**
 * 一首具体曲目。归属于某个 Rights Holder，
 * 可通过 artistIds 关联到 Artist 条目
 */
export const trackEntrySchema = z.object({
  name: z.string().min(1),
  artist: z.string().min(1),
  artistIds: z.array(z.string()).optional(),
  status: statusSchema,
  note: z.string().optional(),
});
export type TrackEntry = z.infer<typeof trackEntrySchema>;

/** 包含 [[track]] 数组的 toml 文件结构 */
export const trackFileSchema = z.object({
  track: z.array(trackEntrySchema),
});

/**
 * 艺人/创作者个体。拥有自身的 policy（如黑名单、二创要求），
 * 不包含曲目数据
 */
export const artistSchema = z.object({
  name: z.string().min(1),
  status: statusSchema,
  reason: z.string().optional(),
  note: z.string().optional(),
  references: z.array(z.string()).optional(),
});
export type Artist = z.infer<typeof artistSchema>;

/**
 * 加载后的一个 Rights Holder 全量数据。
 * policy 来自 _policy.toml，tracks 来自其余 toml 文件的曲目合集
 */
export interface ResolvedRightsHolder {
  policy: RightsHolderPolicy;
  tracks: TrackEntry[];
}

/**
 * 内容策略数据库的完整数据集。
 *
 * rightsHolders 的 key 为 data/rights_holders/ 下的目录名，
 * artists 的 key 为 data/artists/ 下的文件名（不含 .toml 后缀）。
 * 查询时所有维度并列展示，综合结论取最严格 status
 */
export interface ContentPolicy {
  rightsHolders: Record<string, ResolvedRightsHolder>;
  artists: Record<string, Artist>;
  independentTracks: TrackEntry[];
}
