# MSIME-Web

组织边界见 [组织规范](https://github.com/metasequoiaime/.github/blob/main/AGENTS.md)。本站负责展示和渲染；用户指南内容来自固定 MSIME-Docs gitlink，更新元数据从实际发布的 Windows 安装包生成。保留现有 Cloudflare Pages 发布集成。

更新清单通过 `automation/update-manifest` 的自动 PR 合入，只允许改动 `public/update.json`。保留 main 的 PR 和 Build、Workflow validation、Dependency review 必需检查；不要恢复 main 直推。自动化使用组织已有凭据触发正常 PR CI，自动合并脚本必须先校验真实规则、同仓来源、改动范围和精确提交。
