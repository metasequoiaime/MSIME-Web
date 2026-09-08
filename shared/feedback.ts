import { z } from "zod";

export const targets = {
  windows: { label: "Windows 输入法", repo: "MSIME-Windows" },
  apple: { label: "macOS / iOS 输入法", repo: "MSIME-Apple" },
  linux: { label: "Linux 输入法", repo: "MSIME-Linux" },
  engine: { label: "公共引擎、输入方案与词库", repo: "MSIME-Engine" },
  backend: { label: "公共 API", repo: "MSIME-Backend" },
  docs: { label: "使用文档", repo: "MSIME-Docs" },
  web: { label: "官网", repo: "MSIME-Web" },
} as const;
export const targetSchema = z.enum(["windows", "apple", "linux", "engine", "backend", "docs", "web"]);
export const contactFields = [
  { name: "qq", label: "QQ 号码", placeholder: "QQ 号码", type: "text", max: 100 },
  { name: "qqNickname", label: "QQ 昵称", placeholder: "QQ 显示昵称", type: "text", max: 100 },
  { name: "wechat", label: "微信", placeholder: "微信号", type: "text", max: 100 },
  { name: "github", label: "GitHub 用户名", placeholder: "例如 octocat，无需 @ 或链接", type: "text", max: 39 },
  { name: "email", label: "Email", placeholder: "name@example.com", type: "email", max: 254 },
] as const;
const contactText = (max: number) => z.string().trim().max(max, `联系方式最多 ${max} 个字`).refine(value => !/[\r\n]/.test(value), "联系方式不能换行").default("");
export const feedbackSchema = z.object({
  target: targetSchema,
  title: z.string().trim().min(5, "请用至少 5 个字概括需求").max(100, "标题最多 100 个字").refine(value => !/[\r\n]/.test(value), "标题不能换行"),
  background: z.string().trim().min(10, "请用至少 10 个字描述使用场景").max(3000, "使用场景最多 3000 个字"),
  expected: z.string().trim().min(10, "请用至少 10 个字描述期望行为").max(3000, "期望行为最多 3000 个字"),
  environment: z.string().trim().max(500, "使用环境最多 500 个字"),
  extra: z.string().trim().max(3000, "补充说明最多 3000 个字"),
  qq: contactText(100),
  qqNickname: contactText(100),
  wechat: contactText(100),
  github: z.string().trim().max(39, "GitHub 用户名最多 39 个字符").refine(value => value === "" || /^[a-z\d]+(?:-[a-z\d]+)*$/i.test(value), "请填写 GitHub 用户名，无需 @ 或个人主页链接").default(""),
  email: z.string().trim().max(254, "Email 最多 254 个字符").refine(value => value === "" || z.email().safeParse(value).success, "请填写有效的 Email 地址").default(""),
  consent: z.literal(true, { error: "请确认内容将公开发布到 GitHub" }),
});
export type Feedback = z.infer<typeof feedbackSchema>;

// 用户文字置于引用块，避免伪造模板标题；打断 @ 提及，避免匿名表单触发批量通知。
const quote = (value: string) => (value || "未填写").replaceAll("@", "@\u200b").split(/\r?\n/).map(line => `> ${line}`).join("\n");
// 联系方式按代码字面量展示，保留可复制的 @，也不触发 GitHub 提及或解释 Markdown。
const contactLiteral = (value: string) => {
  const delimiter = "`".repeat(Math.max(0, ...(value.match(/`+/g) ?? []).map(part => part.length)) + 1);
  return `${delimiter} ${value} ${delimiter}`;
};
export function formatIssue(data: Feedback) {
  const contacts = contactFields.flatMap(field => {
    const value = data[field.name]?.trim();
    return value ? [`> ${field.label}：${contactLiteral(value)}`] : [];
  });
  return {
    title: `[需求] ${data.title.replaceAll("@", "@\u200b")}`,
    body: [
      "## 需求归属", targets[data.target].label,
      "## 使用场景与问题", quote(data.background),
      "## 期望行为", quote(data.expected),
      "## 使用环境与版本", quote(data.environment),
      "## 补充说明", quote(data.extra),
      ...(contacts.length ? ["## 联系方式（提交者自愿公开，未经验证）", contacts.join("\n\n")] : []),
      "---", "通过水杉输入法官网需求表单提交。提交者已确认以上内容公开发布。",
    ].join("\n\n"),
  };
}
