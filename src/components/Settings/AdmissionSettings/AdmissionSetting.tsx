import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { Link } from "react-router-dom"

export default function AdmissionSetting() {
  const { t } = useTranslation()
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">{t("admission_management")}</h1>
        <p className="text-muted-foreground max-w-[600px]">
          {t("manage_admission,_seats_,and_quotas_efficiently_with_our_comprehensive_admission_management_system.")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{t("seat_management")}</CardTitle>
            <CardDescription>{t("manage_available_seats_across_classes_and_quotas")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">
              {t("configure_seat_allocation_for_each_class_and_assign_seats_to_different_quotas_like_RTE,_Management,_etc.")} 
              Sports, etc.
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/d/settings/admission/seats" className="w-full">
              <Button className="w-full">{t("manage_seats")}</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>{t("quota_configuration")}</CardTitle>
            <CardDescription>{t("create_and_manage_admission_quotas")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">
              {t("define_custom_quotas,_set_eligibility_criteria,_and_allocate_seats_for_each_quota_category.")}
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/d/settings/admission/quotas" className="w-full">
              <Button className="w-full">{t("configure_quotas")}</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

