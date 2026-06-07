import { computed, type ComputedRef, type Ref } from "vue";
import { policyIndex } from "../search/policyIndex";
import { search, type SearchResults } from "../search/index";

/**
 * 输入响应式 query，返回响应式搜索结果。
 *
 * 性能：数据规模（百级别条目 + 简单 includes）每次按键重算远低于一帧，无需节流。
 *
 * 注意：policyIndex 是模块级 frozen 常量，在 computed 外读取不会影响响应式依赖。
 * 若未来切换到运行时可变数据源（如在线编辑），需把 index 读取也移进 computed
 */
export function useSearch(query: Ref<string>): ComputedRef<SearchResults> {
  return computed(() => search(policyIndex, query.value));
}
