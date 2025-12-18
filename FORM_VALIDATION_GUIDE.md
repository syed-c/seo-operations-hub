# Form Validation Guide

This document explains how to properly use react-hook-form with Zod validation in the SEO Operations Hub project.

## Current Setup

The project has the following form-related dependencies installed:
- `react-hook-form`: Form state management
- `@hookform/resolvers`: Integration with validation libraries
- `zod`: Schema validation library
- Pre-built form components in `src/components/ui/form.tsx`

## Best Practices

### 1. Use Zod for Schema Validation
Define form schemas using Zod for type-safe validation:

```typescript
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

### 2. Use useForm Hook
Initialize forms with proper typing and validation:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    email: "",
    password: "",
  },
});
```

### 3. Use Pre-built Form Components
Utilize the pre-built form components for consistent styling:

```tsx
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input type="email" {...field} />
      </FormControl>
      <FormDescription>Enter your email address</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 4. Handle Form Submission
Use the handleSubmit function for proper validation:

```typescript
function onSubmit(data: FormValues) {
  console.log(data);
  // Submit to API
}

<form onSubmit={form.handleSubmit(onSubmit)}>
  {/* form fields */}
  <Button type="submit">Submit</Button>
</form>
```

## Example Implementation

Here's a complete example of a validated form:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  function onSubmit(data: ProfileFormValues) {
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
}
```

## Migration Guidelines

To migrate existing forms to use react-hook-form:

1. Identify forms using plain HTML inputs
2. Define a Zod schema for validation
3. Wrap the form with the Form component
4. Replace plain inputs with FormField components
5. Use handleSubmit for form submission
6. Add FormMessage components for error display

## Benefits

1. **Type Safety**: Full TypeScript support with Zod schemas
2. **Validation**: Built-in validation with clear error messages
3. **Accessibility**: Proper ARIA attributes and labeling
4. **Consistency**: Unified styling through UI components
5. **Performance**: Efficient re-renders with controlled components