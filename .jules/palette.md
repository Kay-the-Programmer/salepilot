## 2026-01-22 - Accessible Form Fields
**Learning:** Screen readers need explicit associations between inputs and their helper text/error messages using `aria-describedby`, and error states using `aria-invalid`. Visual proximity is insufficient for non-visual users.
**Action:** Automatically generate unique IDs for helper text and link them to inputs using `aria-describedby` in all form components.
