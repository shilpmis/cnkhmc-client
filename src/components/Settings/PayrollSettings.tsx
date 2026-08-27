import React, { useEffect } from 'react'
import { SaralCard } from '../ui/common/SaralCard'
import { useTranslation } from '@/redux/hooks/useTranslation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFetchPayrollSettingsQuery, useUpdatePayrollSettingsMutation } from '@/services/PayrollService';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const taxSlabSchema = z.object({
  min: z.coerce.number().min(0, 'Min value must be positive'),
  max: z.coerce.number().min(0, 'Max value must be positive'),
  tax: z.coerce.number().min(0, 'Tax value must be positive'),
});

const payrollSettingsSchema = z.object({
  lopCalculationBase: z.string(),
  lopDaysDenominator: z.string(),
  epfEmployeePercentage: z.coerce.number().min(0).max(100),
  epfEmployerPercentage: z.coerce.number().min(0).max(100),
  esiEmployeePercentage: z.coerce.number().min(0).max(100),
  esiEmployerPercentage: z.coerce.number().min(0).max(100),
  taxSlabs: z.array(taxSlabSchema),
});

type PayrollSettingsFormValues = z.infer<typeof payrollSettingsSchema>;

export default function PayrollSettings() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useFetchPayrollSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdatePayrollSettingsMutation();

  const form = useForm<PayrollSettingsFormValues>({
    resolver: zodResolver(payrollSettingsSchema),
    defaultValues: {
      lopCalculationBase: 'Gross Salary',
      lopDaysDenominator: 'Actual Days in Month',
      epfEmployeePercentage: 12.0,
      epfEmployerPercentage: 12.0,
      esiEmployeePercentage: 0.75,
      esiEmployerPercentage: 3.25,
      taxSlabs: [],
    },
  });

  const { fields: taxSlabs, append, remove } = useFieldArray({
    control: form.control,
    name: 'taxSlabs',
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        lopCalculationBase: settings.lop_calculation_base || 'Gross Salary',
        lopDaysDenominator: settings.lop_days_denominator || 'Actual Days in Month',
        epfEmployeePercentage: settings.epf_employee_percentage || 12.0,
        epfEmployerPercentage: settings.epf_employer_percentage || 12.0,
        esiEmployeePercentage: settings.esi_employee_percentage || 0.75,
        esiEmployerPercentage: settings.esi_employer_percentage || 3.25,
        taxSlabs: settings.tax_slabs || [],
      });
    }
  }, [settings, form]);

  const onSubmit = async (values: PayrollSettingsFormValues) => {
    try {
      const payload: any = {
        lop_calculation_base: values.lopCalculationBase,
        lop_days_denominator: values.lopDaysDenominator,
        epf_employee_percentage: values.epfEmployeePercentage,
        epf_employer_percentage: values.epfEmployerPercentage,
        esi_employee_percentage: values.esiEmployeePercentage,
        esi_employer_percentage: values.esiEmployerPercentage,
        tax_slabs: values.taxSlabs,
      };
      await updateSettings(payload).unwrap();
      toast({
        title: t('success'),
        description: t('payroll_settings_updated_successfully'),
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_update_payroll_settings'),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SaralCard title="Payroll Settings" description="Manage your payroll and tax configurations">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          
          {/* LOP Configuration */}
          <div>
            <h3 className="text-lg font-medium mb-4">Loss of Pay (LOP) Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lopCalculationBase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LOP Calculation Base</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select calculation base" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Gross Salary">Gross Salary</SelectItem>
                        <SelectItem value="Basic Salary">Basic Salary</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lopDaysDenominator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LOP Days Denominator</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select days denominator" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Actual Days in Month">Actual Days in Month</SelectItem>
                        <SelectItem value="Fixed 30 Days">Fixed 30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <hr className="my-6" />

          {/* Statutory Percentages */}
          <div>
            <h3 className="text-lg font-medium mb-4">Statutory Deductions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="epfEmployeePercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EPF Employee Contribution (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="epfEmployerPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EPF Employer Contribution (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="esiEmployeePercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ESI Employee Contribution (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="esiEmployerPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ESI Employer Contribution (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <hr className="my-6" />

          {/* Tax Slabs */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Professional Tax Slabs</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ min: 0, max: 0, tax: 0 })}>
                <Plus className="h-4 w-4 mr-2" /> Add Slab
              </Button>
            </div>
            
            {taxSlabs.length === 0 && (
              <p className="text-sm text-gray-500 mb-4">No tax slabs configured.</p>
            )}

            <div className="space-y-4">
              {taxSlabs.map((item, index) => (
                <div key={item.id} className="flex gap-4 items-end">
                  <FormField
                    control={form.control}
                    name={`taxSlabs.${index}.min`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Min Range</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`taxSlabs.${index}.max`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Max Range</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`taxSlabs.${index}.tax`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Tax Amount</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </form>
      </Form>
    </SaralCard>
  )
}
