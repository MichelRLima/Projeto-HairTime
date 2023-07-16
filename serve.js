// Importar as dependências
const express = require('express');
const cron = require('node-cron');
const mongoose = require('mongoose');

// Criar instância do Express
const app = express();
const port = 3002; // Porta do servidor
const bodyParser = require('body-parser');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const session = require('express-session');
// Configurar o Express para lidar com solicitações JSON
app.use(express.json());
app.set('views', __dirname + '/pages');
app.set('view engine', 'ejs');
app.use(express.static((__dirname + '/pages')));
app.use(bodyParser.urlencoded({ extended: true }));
// Conectando ao banco de dados MongoDB
mongoose.connect(
    'mongodb+srv://michelrocha502:root@cluster0.ozgxq3o.mongodb.net/Barbearia?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true }
)
    .then(() => {
        console.log('Conectado ao banco de dados com sucesso');
    })
    .catch((err) => {
        console.log(err.message);
    });

var usuario = [
    {
        login: '123',
        senha: '123'
    }
]


app.use(
    session({
        secret: 'teste',
        cookie: { maxAge: 3600000 },
    })
);

// Definir o modelo do seu documento
const Agendamento = mongoose.model('agendamentos', new mongoose.Schema({
    nome: String,
    opcao1: Boolean,
    opcao2: Boolean,
    opcao3: Boolean,
    horario: String

}));

const horarios = mongoose.model('horarios', new mongoose.Schema({
    hora: String,
    disponibilidade: Boolean


}));
/*
// Criar um novo documento
const novoDocumento = new horarios({
    horario: 'Horario',

});

const novoDocumento1 = new Agendamento({
    nome: 'Agendamento',

});


novoDocumento.save()
novoDocumento1.save()
    .then(() => {
        console.log('Documento salvo com sucesso');
    })


*/

// Agendar a tarefa para executar às 23:25 todos os dias
cron.schedule('0 0 * * *', async () => {
    try {
        // Apagar a coleção "agendamento"
        await Agendamento.deleteMany({});

        // Atualizar todos os documentos da coleção "horarios" definindo "disponibilidade" como true
        await horarios.updateMany({}, { disponibilidade: true });

        console.log('Coleção "agendamento" apagada com sucesso. Disponibilidade atualizada para true em todos os horarios.');
    } catch (error) {
        console.error('Erro ao apagar a coleção "agendamento" e atualizar a disponibilidade:', error);
    }
});



//rota inicial para acessar o home. Passado o array agendamentos que se encontra no banco de dados
app.get('/', (req, res) => {
    Agendamento.find() //função para puxar todos os agendamentos
        .then(agendamentos => { //passado como agendamentos
            res.render('home', { agendamentos: agendamentos });//passado como agendamentos para a pagina home
        })

});

app.get('/login', async (req, res) => {
    if (req.session.login == null) {
        res.render('login');
    } else {
        try {
            const todosHorarios = await horarios.find();
            res.render('adminpainel', { horarios: todosHorarios });
        } catch (err) {
            console.error('Erro ao buscar os horários:', err);
            res.status(500).send('Erro interno do servidor');
        }
    }
});


app.post('/login', (req, res) => {

    usuario.map((val) => {
        if (val.login === req.body.login && val.senha === req.body.senha) {
            req.session.login = 'Michel';
        }
    });
    res.redirect('/login');


});

// Rota para exclusão de um post
app.get('/admin/delete/:id', (req, res) => {
    horarios.deleteOne({ _id: req.params.id })
        .then(() => {
            res.redirect('/login');
        })
        .catch(() => {
            // Lida com o erro, se necessário
        });
});
app.post('/admin/cadastro', (req, res) => {
    horarios.create({
        hora: req.body.hora + ":" + req.body.minutos,
        disponibilidade: true
    });

    // Adicionar um atraso de 2 segundos antes do redirecionamento
    setTimeout(() => {
        res.redirect('/login');
    }, 2000); // 2000 milissegundos = 2 segundos
});

// Rota para retornar os dados de agendamentos em formato JSON
app.get('/agendamentos-json', (req, res) => {
    Agendamento.find()
        .then(agendamentos => {
            res.json(agendamentos); // Retorna os dados de agendamentos em formato JSON
        })
        .catch(error => {
            console.log('Erro ao buscar os dados de agendamentos:', error);
            res.status(500).json({ error: 'Erro ao buscar os dados de agendamentos' });
        });
});



//roda para acessar a aba de agendamentos
app.get('/agendamento', (req, res) => {
    horarios.find() //função para puxar todos os horarios
        .then((horarios) => { //passado como horarios
            res.render('agendamento', { horarios: horarios });//passado como ahorarios para a pagina agendamentos
        })

});

app.get('/sucesso', (req, res) => {
    const nome = req.query.nome;
    const opcao1 = req.query.opcao1;
    const opcao2 = req.query.opcao2;
    const opcao3 = req.query.opcao3;
    const horario = req.query.horario;

    res.render('sucesso', { nome, opcao1, opcao2, opcao3, horario });
});



//roda para quando ocorre o sucesso no agendamento. Aqui adiciona o agendamneto no banco de dados
app.post('/agendamento/sucess', async (req, res) => {
    const nome = req.body.nome;
    const opcao1 = req.body.opcao1; // Converte o valor da opção 1 para um valor booleano
    const opcao2 = req.body.opcao2; // Converte o valor da opção 2 para um valor booleano
    const opcao3 = req.body.opcao3; // Converte o valor da opção 3 para um valor booleano
    const horarioSelecionado = req.body.horario; // Recupera o valor do horário selecionado no botão
    let disponibilidade = false

    try {
        const horario = await horarios.findOne({ hora: horarioSelecionado }).exec();

        if (horario && horario.disponibilidade) {
            disponibilidade = true;
            console.log(disponibilidade)
        } else {
            disponibilidade = false;
            console.log(disponibilidade)
        }
    } catch (err) {
        console.error('Erro ao buscar o horário:', err);
        // Trate o erro de acordo com suas necessidades
    }


    try {

        // Obtenha a data e a hora atual
        const dataAtual = new Date();
        const horarioAtual = dataAtual.getHours() + ":" + dataAtual.getMinutes();

        // Verifique se o horário selecionado é posterior ao horário atual
        if (new Date(horarioSelecionado) < horarioAtual || disponibilidade === false) {

            return res.redirect('/erro'); // Redireciona para a página de erro em caso de selecionar um horario indisponivel
        }

        // Atualize a disponibilidade do horário selecionado para "false" no MongoDB
        await horarios.findOneAndUpdate(
            { hora: horarioSelecionado },
            { disponibilidade: false },
            { useFindAndModify: false }
        );

        // Crie um novo documento de agendamento com os dados fornecidos
        const novoAgendamento = new Agendamento({
            nome: nome,
            opcao1: opcao1,
            opcao2: opcao2,
            opcao3: opcao3,
            horario: horarioSelecionado
        });

        // Salve o novo documento de agendamento
        await novoAgendamento.save();

        console.log('Agendamento salvo com sucesso');
        io.emit('atualizacaoAgendamentos'); // Emita um evento 'atualizacaoAgendamentos' para todos os clientes via Socket.IO
        res.redirect(`/sucesso?nome=${nome}&opcao1=${opcao1}&opcao2=${opcao2}&opcao3=${opcao3}&horario=${horarioSelecionado}`);


    } catch (err) {
        console.error('Erro ao salvar o agendamento:', err);
        return res.status(400).send(err.message);
    }


});

app.get('/erro', (req, res) => {

    res.render('erroHorario')

});

app.get('/voltar-agendamento', (req, res) => {
    res.redirect('/agendamento'); // Redireciona para a rota '/agendamento'
});



// Iniciar o servidor
http.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});