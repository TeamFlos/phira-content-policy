import policy from "virtual:content-policy";
import { buildIndex, type SearchIndex } from "./index";

/** 模块级单例：数据是构建期烘焙进 bundle 的不可变常量，索引只需建一次 */
export const policyIndex: SearchIndex = buildIndex(policy);
