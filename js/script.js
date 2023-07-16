const socketIO = io(); // Inicializa uma conexão Socket.IO e armazena em uma variável chamada socketIO
console.log("conectado"); // Exibe uma mensagem no console indicando que a conexão foi estabelecida

// Quando receber um evento 'atualizacaoAgendamentos' do servidor via Socket.IO
socketIO.on('atualizacaoAgendamentos', () => {
    atualizarDivContainerAtendimento(); // Chama a função para atualizar a div "containerAtendimento"
});

function atualizarDivAtendimentoAtual(agendamentos) {
    // Função para atualizar a div "atendimentoAtual" com base nos agendamentos recebidos
    const agora = new Date(); // Obtém a data e hora atual
    const agendamentoMaisCedo = agendamentos
        .filter((agendamento) => {
            // Filtra os agendamentos com horário posterior ao atual
            const horarioAgendamento = new Date();
            const [hora, minuto] = agendamento.horario.split(':');
            horarioAgendamento.setHours(hora, minuto);

            return horarioAgendamento > agora;
        })
        .sort((a, b) => {
            // Ordena os agendamentos em ordem crescente de horário
            const horarioA = new Date();
            const horarioB = new Date();
            const [horaA, minutoA] = a.horario.split(':');
            const [horaB, minutoB] = b.horario.split(':');
            horarioA.setHours(horaA, minutoA);
            horarioB.setHours(horaB, minutoB);

            return horarioA - horarioB;
        })[0];

    if (agendamentoMaisCedo) {
        // Se houver um agendamento mais cedo, cria o HTML correspondente e atualiza a div "atendimentoAtual"
        var html = '<div class="atendimentoMaisCedo">';
        html += '<p>' + agendamentoMaisCedo.nome + '</p>';
        html += '<p>Horario: ' + agendamentoMaisCedo.horario + '</p>';

        if (agendamentoMaisCedo.opcao1) {
            html += '<p>Opção 1</p>';
        }

        if (agendamentoMaisCedo.opcao2) {
            html += '<p>Opção 2</p>';
        }

        if (agendamentoMaisCedo.opcao3) {
            html += '<p>Opção 3</p>';
        }

        html += '</div>';

        $('.atendimentoAtual').html(html);
    } else {
        // Se não houver agendamento encontrado, exibe uma mensagem indicando isso na div "atendimentoAtual"
        $('.atendimentoAtual').html('<p>Nenhum agendamento encontrado.</p>');
    }
}

function atualizarDivContainerAtendimento() {
    // Função para obter os dados atualizados do servidor e atualizar a div "containerAtendimento"

    // Exemplo de código para fazer uma requisição AJAX para obter os dados atualizados
    $.ajax({
        url: '/agendamentos-json', // URL da rota que retorna os dados atualizados do servidor
        method: 'GET',
        dataType: 'json', // Tipo de dados esperado (no caso, JSON)
        success: function (data) {
            // Função de callback executada quando a requisição AJAX é bem-sucedida
            const horarioAtual = new Date(); // Obtém a data e hora atual
            const agendamentosFiltrados = data.filter(function (agendamento) {
                // Filtra os agendamentos com horário posterior ao atual
                const horarioAgendamento = new Date(
                    horarioAtual.getFullYear(),
                    horarioAtual.getMonth(),
                    horarioAtual.getDate(),
                    parseInt(agendamento.horario.split(':')[0]),
                    parseInt(agendamento.horario.split(':')[1])
                );
                return horarioAgendamento > horarioAtual;
            });

            // Atualiza a div "containerAtendimento" com base nos agendamentos filtrados
            var html = '';
            agendamentosFiltrados.forEach(function (agendamento) {
                html += '<div class="atendimento">';
                html += '<p>' + agendamento.nome + '</p>';
                html += '<p>Horario: ' + agendamento.horario + '</p>';
                // Outras propriedades do agendamento
                html += '</div>';
            });
            $('.containerAtendimento').html(html);

            // Chama a função para atualizar a div "atendimentoAtual" com base nos agendamentos filtrados
            atualizarDivAtendimentoAtual(agendamentosFiltrados);

            // Verifica e remove os agendamentos que já passaram do horário atual
            verificarAgendamentosPassados();
        },
        error: function (error) {
            // Função de callback executada quando ocorre um erro na requisição AJAX
            console.log('Erro ao buscar os dados atualizados:', error);
        },
    });
}

function verificarAgendamentosPassados() {
    // Função para verificar e remover os agendamentos que já passaram do horário atual
    const horarioAtual = new Date(); // Obtém a data e hora atual
    $('.containerAtendimento .atendimento').each(function () {
        // Percorre cada div de agendamento na div "containerAtendimento"
        const horarioAgendamento = new Date(
            horarioAtual.getFullYear(),
            horarioAtual.getMonth(),
            horarioAtual.getDate(),
            parseInt($(this).find('p:nth-child(2)').text().split(':')[1].trim()),
            parseInt($(this).find('p:nth-child(2)').text().split(':')[2].trim())
        );
        if (horarioAgendamento <= horarioAtual) {
            // Se o horário do agendamento for menor ou igual ao horário atual, remove a div do agendamento
            $(this).remove();
        }
    });
}

function atualizarRelogio() {
    var dataAtual = new Date(); // Obtém a data e hora atual
    var hora = dataAtual.getHours(); // Obtém a hora atual
    var minuto = dataAtual.getMinutes(); // Obtém os minutos atuais
    var segundo = dataAtual.getSeconds(); // Obtém os segundos atuais

    // Adiciona zeros à esquerda para garantir que tenham 2 dígitos
    hora = hora < 10 ? "0" + hora : hora;
    minuto = minuto < 10 ? "0" + minuto : minuto;
    segundo = segundo < 10 ? "0" + segundo : segundo;

    var horarioFormatado = hora + ":" + minuto + ":" + segundo; // Formata o horário no formato HH:MM:SS

    // Atualiza o conteúdo da div com a classe "relogio" com o horário formatado
    $(".relogio").text(horarioFormatado);
    console.log("atualizando relogio");
}

setInterval(atualizarRelogio, 1000); // Atualiza o relógio a cada segundo

atualizarDivContainerAtendimento(); // Executa a função inicialmente para obter os dados e atualizar as divs correspondentes
setInterval(atualizarDivContainerAtendimento, 10000); // Agendar a execução repetida a cada 1 minuto
setInterval(verificarAgendamentosPassados, 1000); // Verificar continuamente a cada 1 segundo