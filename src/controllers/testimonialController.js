import { getTestimonialsService } from '../services/testimonialsService.js';
import Testimonial from '../model/testimonialModel.js';

export const getTestimonials = async (req, res) => {
  try {
    const data = await getTestimonialsService();

    const testimonials = data.map(item => new Testimonial(item));

    return res.json(testimonials);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};