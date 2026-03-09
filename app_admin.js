document.addEventListener('DOMContentLoaded', function () {

    // -------------------------------
    // Получаем параметр из URL
    // -------------------------------
    const params = new URLSearchParams(window.location.search);
    const okrug_cd_param = params.get('okrug_cd');

    console.log("Параметр okrug_cd:", okrug_cd_param);

    // -------------------------------
    // Функция загрузки данных
    // -------------------------------
    function fetchDataAndProcess(url, okrug_cd = null) {

        return fetch(url)
            .then(response => response.json())
            .then(data => {

                if (!Array.isArray(data)) {
                    console.error('Ожидался массив, но получено:', data);
                    return {};
                }

                // -------------------------------
                // ФИЛЬТР ПО ОКРУГУ
                // -------------------------------
                if (okrug_cd) {

                    const filterValue = okrug_cd.trim().toUpperCase();

                    data = data.filter(obj => {

                        const code = (obj.okrug_cd || "")
                            .toString()
                            .trim()
                            .toUpperCase();

                        return code === filterValue;
                    });

                    console.log("После фильтра:", data.length);
                }

                // -------------------------------
                // Группировка
                // -------------------------------
                return data.reduce((acc, obj) => {

                    const key = obj.admin_okrug_cd.trim();

                    if (!acc[key]) {
                        acc[key] = {

                            okrug_cd: obj.okrug_cd,
                            okrug_name: obj.okrug_name,
                            admin_okrug_cd: obj.admin_okrug_cd,
                            admin_okrug_name: obj.admin_okrug_name,

                            balance: obj.balance,
                            coordinat_x: obj.coordinat_x,
                            coordinat_y: obj.coordinat_y,

                            code: obj.admin_okrug_cd,

                            itogo: 0,
                            no_kontrol: 0,
                            in_status: 0,
                            isp: 0,
                            technik: 0,
                            ratio: 0
                        };
                    }

                    acc[key].itogo += Number(obj.itogo) || 0;
                    acc[key].no_kontrol += Number(obj.no_kontrol) || 0;
                    acc[key].in_status += Number(obj.in_status) || 0;
                    acc[key].isp += Number(obj.isp) || 0;
                    acc[key].technik += Number(obj.technik) || 0;
                    acc[key].ratio += Number(obj.ratio) || 0;

                    return acc;

                }, {});
            })

            .catch(error => console.error(`Ошибка загрузки ${url}:`, error));
    }


    // -------------------------------
    // Форматирование чисел
    // -------------------------------
    function numberWithSpaces(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }


    // -------------------------------
    // Загружаем данные
    // -------------------------------
    fetchDataAndProcess(
        'https://viktorgo86.github.io/host_api/city_tech_activity_admin.json',
        okrug_cd_param
    )

    .then(result => {

        console.log("Result:", result);

        const seriesData = Object.values(result).map(item => ({

            x: item.coordinat_x,
            y: item.coordinat_y,

            value: item.ratio,

            region: item.admin_okrug_name,

            val_itogo: item.itogo,
            val_in_status: item.in_status,
            val_isp: item.isp,
            val_no_kontrol: item.no_kontrol,
            val_technik: item.technik,
            val_ratio: item.ratio,

            hint: item.admin_okrug_cd,
            okrug_cd: item.admin_okrug_cd

        }));


        // -------------------------------
        // Строим график
        // -------------------------------
        Highcharts.chart('container', {

            chart: {
                type: 'tilemap',
                inverted: true,
                height: '120%'
            },

            credits: {
                enabled: false
            },

            exporting: false,

            title: {
                text: 'Статистика по выходу техники, внесенной в АСУ ОДС',
                style: {
                    fontSize: '1em'
                }
            },

            subtitle: {
                text: okrug_cd_param
                    ? `Фильтр округа: <b>${okrug_cd_param}</b>`
                    : 'Все административные округа'
            },

            xAxis: {
                visible: false
            },

            yAxis: {
                visible: false
            },

            legend: {
                title: {
                    text: 'Доля исправной техники'
                }
            },

            colorAxis: {

                dataClasses: [
                    { from: 0, to: 30, color: '#d32f2f', name: '< 30%' },
                    { from: 30, to: 50, color: '#f57c00', name: '30% - 50%' },
                    { from: 50, to: 75, color: '#fbc02d', name: '50% - 75%' },
                    { from: 75, to: 90, color: '#7cb342', name: '75% - 90%' },
                    { from: 90, color: '#2e7d32', name: '> 90%' }
                ]

            },

            tooltip: {

                useHTML: true,

                pointFormatter: function () {

                    return '<div style="background:white;padding:12px;border-radius:6px;">'
                        + '<b>' + this.region + '</b><br>'
                        + 'Исправно: <b>' + numberWithSpaces(this.val_isp) + '</b>'
                        + '<br>Всего: <b>' + numberWithSpaces(this.val_itogo) + '</b>'
                        + '<br>Не подлежит контролю: <b>' + numberWithSpaces(this.val_no_kontrol) + '</b>'
                        + '<br>Иные статусы: <b>' + numberWithSpaces(this.val_in_status) + '</b>'
                        + '<br>Всего техники: <b>' + numberWithSpaces(this.val_technik) + '</b>'
                        + '<br>Доля исправной: <b>' + this.val_ratio + '%</b>'
                        + '</div>';
                }

            },

            plotOptions: {

                series: {

                    dataLabels: {

                        useHTML: true,
                        enabled: true,

                        formatter: function () {

                            return `
                                <div style="text-align:center;">
                                    <span>${this.point.hint}</span><br>
                                    <span>${this.point.val_ratio}%</span>
                                </div>
                            `;
                        },

                        style: {
                            textOutline: false,
                            color: '#2E3033'
                        }

                    }

                }

            },

            series: [{
                name: 'Административное деление',
                data: seriesData
            }]

        });

    });

});