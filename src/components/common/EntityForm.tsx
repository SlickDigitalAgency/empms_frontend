import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { EntityRecord, FormField as FieldConfig, ModuleDefinition, Option, ReferenceState } from "@/types"

type EntityFormProps = {
  definition: ModuleDefinition
  initialValue?: EntityRecord | null
  references: ReferenceState
  submitting?: boolean
  onSubmit: (value: EntityRecord) => Promise<void> | void
  onCancel: () => void
}

function fieldOptions(field: FieldConfig, references: ReferenceState): Option[] {
  if (field.options) return field.options
  if (!field.optionsFrom) return []
  return (references[field.optionsFrom] ?? []).map((row) => {
    let label = ""
    if (typeof field.optionLabel === "function") {
      label = field.optionLabel(row, references)
    } else {
      label = String(row[field.optionLabel ?? "id"] ?? row.id ?? "Untitled")
    }
    return {
      value: String(row.id ?? ""),
      label,
    }
  })
}

function inputType(field: FieldConfig) {
  if (field.type === "number" || field.type === "date" || field.type === "time") return field.type
  if (field.type === "phone") return "tel"
  return "text"
}

export function EntityForm({ definition, initialValue, references, submitting, onSubmit, onCancel }: EntityFormProps) {
  const form = useForm<Record<string, any>>({
    resolver: zodResolver(definition.schema),
    defaultValues: Object.fromEntries(definition.fields.map((field) => [field.name, String(initialValue?.[field.name] ?? "")])),
  })

  useEffect(() => {
    form.reset(Object.fromEntries(definition.fields.map((field) => [field.name, String(initialValue?.[field.name] ?? "")])))
  }, [definition.fields, form, initialValue])

  return (
    <Form {...form}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        {definition.fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: control }) => (
              <FormItem className={field.grid === "full" || field.type === "textarea" ? "sm:col-span-2" : ""}>
                <FormLabel>
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </FormLabel>
                <FormControl>
                  {field.type === "select" ? (
                    <Select value={control.value ?? ""} onValueChange={control.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldOptions(field, references).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "textarea" ? (
                    <Textarea rows={4} placeholder={field.placeholder} {...control} />
                  ) : (
                    <Input type={inputType(field)} placeholder={field.placeholder} {...control} />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : initialValue?.id ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
