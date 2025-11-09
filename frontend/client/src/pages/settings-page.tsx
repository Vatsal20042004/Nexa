import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { settingsSchema, type Settings } from "@shared/schema";
import { useTheme } from "@/components/theme-provider";
import { useSettings, useUpdateSettings } from "@/lib/hooks/use-settings";
import { useTopbarStore } from "@/lib/store/topbar-store";
import { toast } from "sonner";

export default function SettingsPage() {
  const setTopbar = useTopbarStore((state) => state.setTopbar);
  const { theme, setTheme } = useTheme();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  useEffect(() => {
    setTopbar("Settings", "Customize your workspace preferences");
  }, [setTopbar]);

  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings || {
      theme: theme as "light" | "dark" | "system",
      workingHoursStart: "09:00",
      workingHoursEnd: "17:00",
      calendarDensity: "comfortable",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const handleSubmit = async (data: Settings) => {
    try {
      setTheme(data.theme);
      await updateSettings.mutateAsync(data);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <div className="overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-theme">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose your preferred color scheme
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="calendarDensity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calendar Density</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-density">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="comfortable">Comfortable</SelectItem>
                          <SelectItem value="compact">Compact</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Adjust spacing in calendar view
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Working Hours</CardTitle>
                <CardDescription>
                  Set your typical work schedule for better planning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="workingHoursStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            data-testid="input-work-start"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workingHoursEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            data-testid="input-work-end"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateSettings.isPending}
                data-testid="button-save-settings"
              >
                {updateSettings.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
