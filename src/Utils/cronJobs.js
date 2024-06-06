import { scheduleJob } from 'node-schedule'
import { couponModel } from '../../DB/Models/coupon.model.js'
import moment from 'moment'

export const changeCouponStatusCron = () => {
    scheduleJob('0 1 0 */3 * *', async function () {

        const validCoupons = await couponModel.find({ couponStatus: 'Valid' })


        const today = moment(new Date());

        for (const coupon of validCoupons) {

            if (moment(new Date(coupon.toDate)).isBefore(today)) {
                console.log(coupon);

                coupon.couponStatus = 'Expired'

                await coupon.save()
            }

            console.log(moment(coupon.toDate).isBefore(today));
        }

        console.log(`cron changeCouponStatusCron() is running.........`)
    })
}
