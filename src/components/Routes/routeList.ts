import { ReactElement, lazy } from 'react'

export interface IPageMeta {
    path: string
    component: ReactElement
    title: string
    description: string
    exact: boolean
    fullPageWidth?: boolean
    // requiredRole: UserRole
    // customStyles?: CSSObject
}

// const AdminPage = lazy(
//     () => import('../AdminPage/AdminPage')
// )

// const introPage  = {
//     path: '/',
//     component: <IntroPage />,
//     title: 'Introduction ',
//     description: 'Welcome ',
//     exact : true,
//     fullPageWidth : true,
//     requiredRole : 'all' as UserRole
// }

// export const DashBordPages : IPageMeta[]=[
//     dashbord,
//     network,
//     dashBordForPitch,
// ]