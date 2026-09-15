export class Appointment {
    constructor({
                    id = null,
                    customerName = '',
                    phone = '',
                    vehicle = '',
                    plate = '',
                    service = '',
                    date = '',
                    time = '',
                    status = 'Pendiente'
                }) {
        this.id = id;
        this.customerName = customerName;
        this.phone = phone;
        this.vehicle = vehicle;
        this.plate = plate;
        this.service = service;
        this.date = date;
        this.time = time;
        this.status = status;
    }
}