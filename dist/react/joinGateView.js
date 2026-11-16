export function joinGateView(o) {
    if (o.trial)
        return { kind: 'trial' };
    if (o.configured && o.requireJoin && !o.named && !o.allowWithout)
        return { kind: 'required' };
    if (o.open)
        return { kind: 'form' };
    return { kind: 'parts', playMode: o.configured && o.playMode, access: true, chip: o.chip };
}
//# sourceMappingURL=joinGateView.js.map