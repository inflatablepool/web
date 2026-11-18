# 工厂确认清单

> 用途：记录网站上需要工厂（工程部 / 质检部）书面确认后才能定稿的数据。
> 每项确认后，在“状态”栏填写确认人、日期和依据文件编号，再按“确认后的修改”执行。
> 在确认前，网站保持现有文字不变，不要单独修改其中某一处，以免产生新的矛盾。

| 编号  | 事项                                   | 优先级 | 状态   | 确认人 / 日期 / 依据 |
| ----- | -------------------------------------- | ------ | ------ | -------------------- |
| FC-01 | 泄压阀 6 PSI 与最大充气压力 8 PSI 矛盾 | P0     | 待确认 |                      |

---

## FC-01 泄压阀 6 PSI 与最大充气压力 8 PSI 矛盾

### 问题

网站同时写了三组压力数值：

- 推荐工作压力：4–5 PSI
- 最大充气压力（Maximum inflation pressure）：8 PSI；破坏性测试 FB-DSP-400（目录款 SR341220）铭牌 Pw = 8.0 PSI
- 泄压阀：超过 6 PSI 自动泄压

如果泄压阀在 6 PSI 就开启，用户实际不可能充到 8 PSI，“最大充气压力 8 PSI”的说法就不成立。专业买家和认证机构会把这当作数据错误。
另外，`src/data/guides.ts` 把 8 PSI 称为“maximum tolerance”（最大耐受压力），`src/data/procurement-guides.ts` 称为“structural limit”（结构极限），同一个数字有三种叫法。

### 请工厂确认的问题

1. 标准款泄压阀的标定开启压力是多少 PSI？公差多少？（请提供阀门型号和供应商规格书）
2. 8 PSI 是什么：用户可充达的最大充气压力，还是结构设计压力 / 铭牌额定压力 Pw（用户正常使用时达不到）？
3. 各系列（矩形、圆形蓝、圆形灰、圆形 / 方形 Hot Tub）的泄压阀和 Pw 是否相同？不同的话，请按系列分别给出。
4. 铭牌上实际印的是哪几个压力值，用的是什么名称？

### 确认后的修改

方案 A：泄压阀实际开启压力为 8 PSI（6 PSI 是旧数据）

- 把 `src/data/pool-catalog.ts` 中的 `POOL_RELIEF_VALVE_PRESSURE` 改为 `'8 PSI'`。
- 把下列位置中所有手写的 “above 6 PSI / 6 PSI” 改为 8 PSI。

方案 B：6 PSI 是泄压阀标定值，8 PSI 是结构设计压力（用户充不到）

- 把 `POOL_MAX_PRESSURE` 的名称和标签从 “Maximum inflation pressure” 改为 “Structural design pressure (Pw, not user-reachable)”。
- 统一全站叫法，不再使用 “maximum inflation pressure / maximum tolerance / structural limit” 三种说法。
- 压力说明改为三档：4–5 PSI 日常使用 → 6 PSI 泄压阀开启 → 8 PSI 结构设计压力（测试基准）。
- 测试结果页把 “equal to the 8 PSI maximum inflation pressure” 改为 “equal to the 8 PSI structural design pressure”。

两种方案都要做：

- 修改完英文后，重跑翻译工作流（`.github/workflows/translate-products.yml`，模式 `content` / `page-meta`），同步 37 种语言。
- 同步更新所有产品页的 JSON-LD 和对外资料（规格书、报价单、说明书）。

### 涉及位置（英文源，2026-11 统计）

| 文件                                                          | 行（约）          | 内容                                                                                                             |
| ------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/data/pool-catalog.ts`                                    | 45–59             | `POOL_OPERATING_PRESSURE` / `POOL_MAX_PRESSURE` / `POOL_RELIEF_VALVE_PRESSURE` 常量和 `POOL_PRESSURE_SPECS` 标签 |
| `src/data/sku-engineering.ts`                                 | 41–42, 66–68      | Pw = 8.0 PSI 等于 8 PSI 最大充气压力                                                                             |
| `src/data/drop-stitch-technology.ts`                          | 58, 189–200       | FAQ 和压力表：8 PSI / Releases above 6 PSI                                                                       |
| `src/data/pool-engineering.ts`                                | 37                | 4-5 PSI operating, 8 PSI maximum and relief above 6 PSI                                                          |
| `src/data/guides.ts`                                          | 142, 156          | maximum tolerance 8 PSI，relief valve above 6 PSI                                                                |
| `src/data/procurement-guides.ts`                              | 339, 353–354, 397 | 8 PSI structural limit，relief above 6 PSI                                                                       |
| `src/content/products/rectangular-drop-stitch-pool.mdx`       | 38–40             | 规格 Max pressure / Relief valve                                                                                 |
| `src/content/products/round-blue-drop-stitch-pool.mdx`        | 35–37             | 同上                                                                                                             |
| `src/content/products/round-grey-drop-stitch-pool.mdx`        | 42–44             | 同上                                                                                                             |
| `src/content/products/hot-tub-round.mdx`                      | 38–40             | 同上                                                                                                             |
| `src/content/products/hot-tub-square-rect.mdx`                | 38–40             | 同上                                                                                                             |
| `src/pages/drop-stitch-pool-technology.astro`                 | 536, 714–715      | Pw = 8.0 PSI；技术说明段落                                                                                       |
| `src/pages/quality-control/destructive-testing/results.astro` | 157–158, 259–261  | 测试 Pw 和压力说明段落                                                                                           |
| `tools/l10n/*.json`、`src/data/pages/{lang}/*.yaml`           | —                 | 各语言翻译，英文定稿后通过翻译工作流同步                                                                         |

可用以下命令复查遗漏：

```bash
rg -n -e "6 ?PSI" -e "8(\.0)? ?PSI" -e "relief valve" src tools/l10n
```
