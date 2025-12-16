# Team Tournament Sets Field - Fix Plan

## Problem Statement
Team tournaments show two sets fields:
1. **Sets Per Individual Match** (1, 3, 5) - ✅ **USED** by backend
2. **Sets Per Team Match** (1, 3, 5, 7, 9) - ❌ **IGNORED** by backend

## Root Cause
- `setsPerMatch` is for INDIVIDUAL tournament matches
- Team tournaments only use `teamConfig.setsPerSubMatch`
- The "Sets Per Team Match" field was added but backend never implemented its purpose

## Recommended Fix: REMOVE the Field (Option 1)

### Reasoning
- Team tournaments don't have "team-level sets" - they have match counts (best-of-5 submatches)
- ITTF regulations only specify sets per sub-match, not team-level sets
- Keeping the field creates false expectation of control over something non-existent

### Changes Required

#### 1. Update `app/tournaments/create/components/TeamConfig.tsx`

**Remove the grid wrapper and the setsPerMatch field:**

```diff
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="teamConfig.setsPerSubMatch"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#495057]">Sets Per Individual Match</FormLabel>
              <div className="flex gap-2">
                {["1", "3", "5"].map((n) => {
                  const isActive = field.value === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => field.onChange(n)}
                      className={`px-4 text-xs py-2 rounded-lg border transition-all
                        ${
                          isActive
                            ? "bg-[#6c6fd5] text-white shadow"
                            : "bg-white text-[#495057] border-gray-300 hover:bg-gray-100"
                        }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

-       <FormField
-         control={form.control}
-         name="setsPerMatch"
-         render={({ field }) => (
-           <FormItem>
-             <FormLabel className="text-[#495057]">Sets Per Team Match</FormLabel>
-             <div className="flex gap-2">
-               {["1", "3", "5", "7", "9"].map((n) => {
-                 const isActive = field.value === n;
-                 return (
-                   <button
-                     key={n}
-                     type="button"
-                     onClick={() => field.onChange(n)}
-                     className={`w-10 h-10 text-sm rounded-lg border transition-all
-                       ${
-                         isActive
-                           ? "bg-[#6c6fd5] text-white shadow"
-                           : "bg-white text-[#495057] border-gray-300 hover:bg-gray-100"
-                       }`}
-                   >
-                     {n}
-                   </button>
-                 );
-               })}
-             </div>
-             <FormDescription className="text-xs">
-               Overall team match structure (best of N)
-             </FormDescription>
-             <FormMessage />
-           </FormItem>
-         )}
-       />
-     </div>
```

**Result: Back to simpler form**

```typescript
<FormField
  control={form.control}
  name="teamConfig.setsPerSubMatch"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-[#495057]">Sets Per Individual Match</FormLabel>
      <FormDescription className="text-xs">
        How many sets each player plays within the team event
      </FormDescription>
      <div className="flex gap-2">
        {["1", "3", "5"].map((n) => {
          const isActive = field.value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => field.onChange(n)}
              className={`px-4 text-xs py-2 rounded-lg border transition-all
                ${
                  isActive
                    ? "bg-[#6c6fd5] text-white shadow"
                    : "bg-white text-[#495057] border-gray-300 hover:bg-gray-100"
                }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### 2. Update `app/tournaments/create/page.tsx`

**Set setsPerMatch for team tournaments automatically (don't let user choose):**

```typescript
const onSubmit = async (data: TournamentFormValues) => {
  // ... existing code ...

  const payload: any = {
    name: data.name,
    format: data.format,
    category: data.category,
    matchType: data.matchType,
    startDate: data.startDate,
    city: data.city,
    venue: data.venue,
    participants: data.participants,
    seedingMethod: "none",
    rules: {
      setsPerMatch: data.category === "team" 
        ? 3  // Default for team tournaments (won't be used, but keep for consistency)
        : Number(data.setsPerMatch),  // Use user input for individual
      pointsPerSet: 11,
      // ... rest of rules
    },
  };

  // ... rest of submission
};
```

#### 3. Update Form Schema

**In `app/tournaments/create/page.tsx` schema (lines 50-170), make setsPerMatch only required for individual tournaments:**

```typescript
const tournamentSchema = z
  .object({
    // ... other fields ...
    setsPerMatch: z.enum(["1", "3", "5", "7", "9"]),
    // ... more fields ...
  })
  .superRefine((data, ctx) => {
    // Only validate setsPerMatch for individual tournaments
    if (data.category === "individual" && !data.setsPerMatch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sets per match is required for individual tournaments",
        path: ["setsPerMatch"],
      });
    }
    // ... existing validation ...
  });
```

### Visual Result

**Before:**
```
Match Structure: 5 Singles | S-D-S | Custom
Sets Per Individual Match: 1 | 3 | 5
Sets Per Team Match: 1 | 3 | 5 | 7 | 9  ← CONFUSING & UNUSED
```

**After:**
```
Match Structure: 5 Singles | S-D-S | Custom
Sets Per Individual Match: 1 | 3 | 5
```

### API Behavior

- ✅ Field still sent: `rules.setsPerMatch` 
- ✅ Automatically set to 3
- ✅ Stored in database (for consistency)
- ✅ Never used (existing behavior continues)
- ✅ No backend changes needed

### Testing

1. Create team tournament
2. Verify form shows only 1 sets field
3. Verify submission works
4. Verify matches are created with correct sub-match sets
5. Verify no errors in backend

### Files to Change

1. ✂️ `app/tournaments/create/components/TeamConfig.tsx` - Remove setsPerMatch field
2. ✂️ `app/tournaments/create/page.tsx` - Auto-set setsPerMatch for teams, update form default

### Files That Don't Change

- ✅ `app/api/tournaments/route.ts` - No change
- ✅ `services/tournament/core/matchGenerationService.ts` - No change
- ✅ `models/TeamMatch.ts` - No change
- ✅ `lib/validations/tournaments.ts` - No change

## Alternative: Add Helper Text (Quick Workaround)

If you want to keep the field but clarify:

```typescript
<FormDescription className="text-xs text-amber-600">
  ⚠️ Note: Team tournaments determine match length by sub-match sets above. 
  This field is for individual tournaments only.
</FormDescription>
```

But this is confusing UX. Better to just remove it.

## Timeline

- **Trivial** - 5 minutes to implement
- **Testing** - 10 minutes
- **Total** - ~15 minutes
