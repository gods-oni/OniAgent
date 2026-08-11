<!--
TEMPLATE — .claude/rules/user-rules.md for the target project.

Always generate this file, even empty. It must exist so that the first rule the user states
has an obvious, unambiguous home — a file that has to be created first tends not to be.

No `paths:` frontmatter: user rules are global by default. If a stated rule turns out to be
scoped to certain files, move it to its own rule file with `paths:` and leave a pointer here.

Delete this comment block in the output; keep the header and the empty sections.
-->

# User rules

Rules {{USER_OR_TEAM}} has stated in conversation. Appended by the `remember-rule` skill as
they come up. Loaded every session.

Each entry records the rule and *why*, because a rule without a reason gets misapplied at the
edges or dropped when it becomes inconvenient.

Format:

```
## <short imperative title>
<the rule, stated concretely enough to verify>
**Why:** <the reason, or "not stated">
**Added:** YYYY-MM-DD
```

---

<!-- New rules go below. Newest last. -->
