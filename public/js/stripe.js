// eslint-disable-next-line import/no-import-module-exports
import axios from 'axios';
import { showAlert } from './alert.js';
// const stripe = Stripe('pk_test_BUkd0ZXAj6m0q0jMyRgBxNns00PPtgvjjr');

exports.bookTour = async tourId => {
  // const stripe = Stripe('your stripe public key');

  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // console.log(session);

    // 2) Create checkout form + charge credit card
    // await stripe.redirectToCheckout({
    //     sessionId: session.data.session.id
    // });
    window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
