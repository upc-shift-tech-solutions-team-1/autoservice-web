import { defineStore } from 'pinia';
import {appointmentService} from "../infrastructure/appointment.service.js";
export const useAppointmentStore = defineStore('appointments', {

    state: () => ({
        appointments: [],
        loading: false
    }),

    actions: {

        async fetchAppointments() {

            this.loading = true;

            try {
                this.appointments =
                    await appointmentService.getAll();
            }
            finally {
                this.loading = false;
            }
        },

        async createAppointment(data) {

            const newAppointment =
                await appointmentService.create(data);

            this.appointments.push(newAppointment);
        }
    }
});