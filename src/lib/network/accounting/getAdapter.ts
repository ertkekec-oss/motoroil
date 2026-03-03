import { AccountingAdapter } from "./types";
import { NoopAccountingAdapter } from "./noop";

export function getAccountingAdapter(): AccountingAdapter {
    // Sprint 4: Depending on tenant/global config, return Hub ERP adapter.
    // Sprint 3: Always isolated/NOOP
    return new NoopAccountingAdapter();
}
