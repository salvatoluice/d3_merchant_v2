import React from 'react'
import Layout from '../../elements/Layout'
import UpdatedStatsSection from './StatsSection'
import BookingsChart from './BookingsChart'
import RecentNotifications from './RecentNotifications'
import RequestService from './RequestService'
import RecentReviews from './RecentReviews'

const Dashboard = () => {
    return (
        <Layout title="Dashboard" subtitle="Overview of your business performance">
            {/* Updated Stats Section with new metrics */}
            <UpdatedStatsSection />
            
            {/* First row: Bookings Chart + Recent Notifications */}
            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="flex w-full md:w-[70%]">
                    <BookingsChart />
                </div>
                <RecentNotifications />
            </div>
            
            {/* Second row: Request Service + Recent Reviews */}
            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="flex w-full md:w-[70%] h-fit">
                    <RequestService />
                </div>
                <RecentReviews />
            </div>
        </Layout>
    )
}

export default Dashboard