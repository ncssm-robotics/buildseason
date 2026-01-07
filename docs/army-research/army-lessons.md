# Retro groups observations into insight

bd create --title="Insight: Session handling undocumented" \
 --label="insight" --label="dotmlpf:doctrine"

# Link observations to insight

bd dep add <obs-1> <insight> --type discovered-from
bd dep add <obs-2> <insight> --type discovered-from

# Skill spawns from insight

bd create --title="Create session-lifecycle skill" \
 --parent=<insight>
