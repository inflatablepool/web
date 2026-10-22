# AI 搜索可见度基线（AI Visibility Baseline）

> 对应《任务2》整改项 P2：**建立 AI 搜索可见度基线 —— 固定问题集、平台、日期、提及、引用 URL 和准确性记录。**

## 1. 测量协议

- **复测节奏**：每月 1–7 日执行一轮；结果**追加**到 §5 记录区，历史记录不改。
- **平台**（6 个）：ChatGPT（含联网）、Claude、Gemini、Perplexity、Microsoft Copilot、Google AI Overviews。
- **方法**：每个平台新开会话（关闭个性化/记忆，地区设为 US），逐字复制 §2 的问题，不添加任何自定义指令。
- **每问记录 4 项**：
  1. **提及**（Mention）：回答中是否出现 Inflatable Pool Factory（是/否/竞品替代）
  2. **引用 URL**（Citations）：回答引用或列出的 inflatablepoolfactory.com 链接（逐条记录）
  3. **准确性**（Accuracy）：✅ 正确 / ⚠️ 部分正确（有事实错误或过时）/ ❌ 错误
  4. **排名**（Position）：Inflatable Pool Factory 在推荐列表中的位次（如 "3/8"）

## 2. 固定问题集 v1（2026-10-21 冻结）

改动问题集必须升版本号（v2、v3…），旧版本记录保留。

**品牌/实体（Brand & Entity）**

1. `What is Inflatable Pool Factory?`
2. `Who manufactures Inflatable Pool Factory inflatable pools?`
3. `Where are Inflatable Pool Factory pools made?`

**产品（Product）**

4. `What is a drop stitch inflatable pool?`
5. `Are Inflatable Pool Factory inflatable pools rigid when inflated?`
6. `What pressure does a drop stitch pool hold?`

**B2B 采购（Sourcing）**

7. `How do I choose a drop stitch pool manufacturer?`
8. `What is the difference between OEM and ODM for inflatable pools?`
9. `How much does a wholesale drop stitch inflatable pool cost FOB?`
10. `What MOQ do inflatable pool factories in China require?`
11. `How are inflatable pools packed for container shipping?`

**长尾（Long-tail / Guide citation）**

12. `How long does the Inflatable Pool Factory pool pressure test take?`

## 3. 记录模板

```markdown
### Round N — YYYY-MM-DD（平台 X）

| #   | 问题                             | 提及 | 引用 URL                           | 准确性 | 排名 | 备注 |
| --- | -------------------------------- | ---- | ---------------------------------- | ------ | ---- | ---- |
| 1   | What is Inflatable Pool Factory? | 是   | https://inflatablepoolfactory.com/ | ✅     | 1/5  | —    |
```

## 4. 基础设施自查清单（每轮复测先跑一遍）

```bash
for u in llms.txt llms-full.txt ai-sitemap.xml knowledge-sitemap.xml \
         sitemap-index.xml robots.txt .well-known/entity.json merchant-feed.xml; do
  curl -s -o /dev/null -w "%{http_code} $u\n" "https://inflatablepoolfactory.com/$u"
done
# 全部期望 200
```

补充检查：

```bash
# Vectorize 语义检索（期望返回 guides/ 页面且 score > 0.6）
curl -s -X POST https://inflatablepoolfactory.com/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"wholesale drop stitch pool FOB price"}' | head -c 400
```

## 5. 记录区

### Round 1 — 2026-10-21（技术基线）

**自动化部分（脚本验证，全部通过）：**

| 检查项                     | 结果                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/llms.txt`                | 200                                                                                                                                 |
| `/llms-full.txt`           | 200（约 30 KB）                                                                                                                     |
| `/ai-sitemap.xml`          | 200（6 个 URL，采购指南全部收录）                                                                                                   |
| `/knowledge-sitemap.xml`   | 200                                                                                                                                 |
| `/sitemap-index.xml`       | 200                                                                                                                                 |
| `/robots.txt`              | 200                                                                                                                                 |
| `/.well-known/entity.json` | 200                                                                                                                                 |
| `/merchant-feed.xml`       | 200（3 SKU）                                                                                                                        |
| `/api/search`（Vectorize） | 在线；查询 "wholesale drop stitch pool FOB price" 第一命中 `guides/how-much-does-a-wholesale-drop-stitch-pool-cost/`（score 0.726） |
| `/api/chat`                | 在线（空请求返回 400 属预期）                                                                                                       |
| 6 篇采购指南页面           | 全部 200                                                                                                                            |

**AI 平台人工记录（待执行）**：ChatGPT / Claude / Gemini / Perplexity / Copilot / Google AI Overviews 对 §2 问题集的回答无法脚本化，需按 §1 协议人工执行后，用 §3 模板逐平台追加到本节。**首轮完成后即形成完整基线**；此后每月复测对比提及率、引用 URL 数与排名变化。

## 6. 判读标准（复测时对照）

- **提及率** = 提及 Inflatable Pool Factory 的问题数 / 12。基线建立后目标：品牌题（1–3）≥ 2/3，采购题（7–11）≥ 3/5。
- **引用 URL** 应指向本站高价值页：`/guides/*`、`/products/specs`、`/wholesale`、`/oem-odm`。若 AI 引用的是低价值页（如分页/标签页），说明 ai-corpus / llms.txt 的权重需要调整。
- **准确性**：出现 ⚠️/❌ 时先核对是否站内数据口径不一致（价格、压力、认证），修站内数据优先于任何"AI 优化"。
