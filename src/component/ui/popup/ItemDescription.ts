import TextField from '../textfield/TextField';

export default class ItemDescription extends TextField {

    protected initialize(): void {
        super.initialize();
        window.addEventListener('mousemove', e => {
            this.left = window.innerWidth / 2 > e.clientX ? e.clientX : e.clientX - this.view.clientWidth;
            this.top = window.innerHeight / 2 > e.clientY ? e.clientY : e.clientY - this.view.clientHeight;
        });
    }

    public set data(data: Object) {
        this.value = this.mapValues(data);
    }

    protected mapValues(obj: Object): string {
        let result = '';
        Object.keys(obj).forEach(key => result +=
            obj[key] ?
                (obj[key] instanceof Object ?
                    `${key}:<br> ${this.mapValues(obj[key])}` :
                    `${key}: ${obj[key]}<br>`) : '',
        );
        return result;
    }
}
