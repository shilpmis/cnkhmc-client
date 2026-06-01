import React from 'react'
import { SaralCard } from '../ui/common/SaralCard'
import { useTranslation } from '@/redux/hooks/useTranslation';

export default function PayrollSettings() {

  const { t } = useTranslation();
  return (
    <SaralCard title={t("notifications")} description={t("manage_your_notification_preferences")}>
                <h3>{t("setting_page")}</h3>
            </SaralCard>
  )
}
