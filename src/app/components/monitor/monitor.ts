import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { PoTableColumn, PoButtonModule, PoTableModule, PoModalComponent, PoModalModule, PoNotificationService, PoNotificationModule, PoDialogModule, PoDialogService, PoInfoModule, PoModalAction, PoFieldModule, PoSelectOption, PoLoadingModule, PoImageModule } from '@po-ui/ng-components';
import { Pendencia, ProtheusService, Detalhe } from '../../../assets/data/protheus.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DateFilterService } from '../../services/date-filter.service';

@Component({
  selector: 'app-monitor',
  standalone: true,
  templateUrl: './monitor.html',
  styleUrls: ['./monitor.css'],
  imports: [CommonModule, PoButtonModule, PoTableModule, PoModalModule, PoNotificationModule, PoDialogModule, PoInfoModule, FormsModule, PoFieldModule, PoLoadingModule, PoImageModule]

})
export class Monitor implements OnInit {

  titulos: Pendencia[] = [];
  loading: boolean = false;
  registrar: number = 0;
  erros: number = 0;
  email: number = 0;
  total: number = 0;
  cancela: number = 0;
  altera: number = 0;
  get dataInicio(): string {
    return this.dateFilterService.dataInicio;
  }
  set dataInicio(value: string) {
    this.dateFilterService.dataInicio = value;
  }

  get dataFim2(): string {
    return this.dateFilterService.dataFim;
  }
  set dataFim2(value: string) {
    this.dateFilterService.dataFim = value;
  }
  docSerie: string = '';
  selectedOperacao: string ='';
//paginacao
  page: number = 1;
  pageSize: number = 200; // Define o limite de 100 por busca
  hasNext: boolean = false
  
  @ViewChild('detalhesModal') detalhesModal!: PoModalComponent;
  @ViewChild('advancedFilterModal') advancedFilterModal!: PoModalComponent;
  detalhesTitulo: Detalhe[] = [];
  detalhesModalLoading: boolean = false;

  columnsDetalhes: PoTableColumn[] = [
    { property: 'desc'   , label: 'Descrição' },
    { property: 'forma'  , label: 'Tipo Liquidação' },
    { property: 'vlbaixa', label: 'Valor Baixa', type: 'currency', format: 'BRL' },
    { property: 'saldo'  , label: 'Saldo'      , type: 'currency', format: 'BRL' },
    { property: 'dtbaixa', label: 'Data Baixa' }
  ];

  get totalVlbaixa(): number {
    if (!this.detalhesTitulo || this.detalhesTitulo.length === 0) {
      return 0;
    }
    return this.detalhesTitulo.reduce((acc, item) => acc + (Number(item.vlbaixa) || 0), 0);
  }

  get totalSaldo(): number {
    if (!this.detalhesTitulo || this.detalhesTitulo.length === 0) {
      return 0;
    }
    const vlreal = Number(this.detalhesTitulo[0].vlreal) || 0;
    const saldoCalculado = vlreal - this.totalVlbaixa;
    return saldoCalculado < 0 ? 0 : saldoCalculado;
  }

  get hasDtbaixa(): boolean {
    return !!this.detalhesTitulo && this.detalhesTitulo.some(item => !!item.dtbaixa);
  }

  get dataBaixa(): string {
    if (!this.detalhesTitulo || this.detalhesTitulo.length === 0) {
      return 'N/A';
    }
    const baixas = this.detalhesTitulo.filter(item => item.dtbaixa);
    return baixas.length > 0 ? baixas[baixas.length - 1].dtbaixa : 'N/A';
  }

  columns: PoTableColumn[] = [
    { property: 'oper'         , label: 'Operacao'       , width: '10%'        , type: 'label'       , labels: [ 
      { value: 'Cancelamento'  , label: 'Cancelamento'   , color: '#ff0000ff', textColor: '#FFFFFF'  },
      { value: 'Transm. Padrao', label: 'Transm. Padrao' , color: '#00d60bda', textColor: '#FFFFFF'  },
      { value: 'Alteracao'     , label: 'Alteracao'      , color: 'rgb(0, 140, 255)', textColor: 'rgb(248, 248, 248)'},
    ]},
    { property: 'transf'  , label: 'Transmissão', type: 'subtitle', width: '5%', subtitles: [
      { value: '' , color: 'color-02', label: 'A Transmitir', content: '' },
      { value: 'F', color: 'color-07', label: 'Falha na Transmissao', content: '' },
      { value: 'S', color: 'color-10', label: 'Transmitido', content: '' }
    ]},
    { property: 'baixa'  , label: 'Baixa', type: 'subtitle', width: '5%', subtitles: [
      { value: '', color: 'color-01', label: 'Em aberto', content: '' },
      { value: 'A', color: 'color-01', label: 'Em aberto', content: '' },
      { value: 'E', color: 'color-07', label: 'Erro na Baixa', content: '' },
      { value: 'B', color: 'color-10', label: 'Baixado', content: '' }
    ]},
    { 
      property: 'emailDesc', 
      label: 'Env.Email', 
      type: 'link', 
      action: (value: any, row: any) => this.exibirObs(row),
      color: 'color-07'//(row: any) => this.getColorEmail(row.email)
    },
    { property: 'bordero' , label: 'Bordero' },
    { 
      property: 'numtit', 
      label: 'Titulo',
      type: 'link',
      action: (value: any, row: any) => this.abrirModalDetalhesTitulo(row)
    },
    { property: 'prefixo' , label: 'Prefixo' },
    { property: 'parcela' , label: 'Parcela' },
    { property: 'emissao' , label: 'Emissao' },
    { property: 'tipo'    , label: 'Tipo'    },
    { property: 'nomecli' , label: 'Nome Cliente' }
  ];

  constructor(
    private protheusService: ProtheusService,
    private poNotification: PoNotificationService,
    private poDialog: PoDialogService,
    private sanitizer: DomSanitizer,
    private dateFilterService: DateFilterService
  ) { }

  ngOnInit(): void {
    this.loadMonitor();
  }


  loadMonitor(): void {
    if (!this.dataInicio || !this.dataFim2) {
      return;
    }
    if (!this.docSerie || this.docSerie.length < 4) {
      this.docSerie ="ZZZ";

    } else if (this.docSerie.length !== 12 || !/^\d+$/.test(this.docSerie)) {
        this.poNotification.warning('O campo de busca deve conter exatamente 12 números.');
        return;
    }

    this.loading = true;

    const inicio = this.formatoData(this.dataInicio);
    const fim = this.formatoData(this.dataFim2);
    const doc = this.docSerie

    this.protheusService.getMonitor(inicio, fim,doc, this.page, this.pageSize).subscribe({
      next: (res: any) => {
        // Se for a primeira página, substitui. Se for a próxima, concatena.
        let novosItens = res.items || res; // Ajuste conforme o retorno da sua API

        // Adiciona o número sequencial levando em conta a paginação
        novosItens = novosItens.map((item: any, index: number) => ({
          ...item,
          obs: this.decodeSpecialCharacters(item.obs),
          emailDesc: this.getEmailLabel(item.email)
        }));
        
        if (this.page === 1) {
          this.titulos = novosItens;
        } else {
          this.titulos = [...this.titulos, ...novosItens];
        }

        this.hasNext = res.hasNext || novosItens.length >= this.pageSize;
        this.loading = false;
        this.calcularIndicadores();
      },
      error: () => {
        this.loading = false;
        this.poNotification.warning('Não foi possível encontrar os carregamentos.');
        // Aqui você pode adicionar uma notificação de erro para o usuário
      }
    });
  }
  
  private formatoData(data: string): string {
    return data ? data.replace(/-/g, '') : '';
  }

  
  onDataInicioChange(data: string) {
    // this.dataInicio = data;
    this.dataFim2 = ''; // Opcional: limpa a data fim ao trocar o início para forçar nova seleção
  }

  onDataFimChange(data: string) {
    // this.dataFim = data;
    // this.loadMonitor();
  }


  aplicarFiltro() {
    this.advancedFilterModal.close();
    this.loadMonitor();
  }

  exibirObs(row: any) {
    this.poDialog.alert({
      title: 'Observação do Registro',
      message: row.obs || 'Nenhuma observação disponível para este título.',
      ok: () => {}
    });
  }

  private getEmailLabel(email: string): string {
    const labels: any = {
       '': ' ',
      '1': 'Enviado',
      '0': 'Aguardando',
      '2': 'Erro',
      '3': 'Falha',
      'X': ''
    };
    return labels[email] || email;
  }

  abrirModalDetalhesTitulo(row: any) {
    this.detalhesModalLoading = true;
    this.detalhesTitulo = []; // Limpa detalhes anteriores

    this.selectedOperacao = row.oper;

    const { numtit, prefixo } = row;
    const parcela = row.parcela || 'ZZZ';

    this.protheusService.getDetalhe(numtit, prefixo, parcela).subscribe({
      next: (detalhes: Detalhe[]) => {
        this.detalhesTitulo = detalhes.map(d => ({
          ...d,
          nome: this.decodeSpecialCharacters(d.nome),
          desc: this.decodeSpecialCharacters(d.desc)
        }));
        this.detalhesModalLoading = false;
        this.detalhesModal.open();
      },
      error: (error) => {
        this.detalhesModalLoading = false;
        this.poNotification.error('Erro ao buscar detalhes do título.');
        console.error('Erro ao buscar detalhes:', error);
      }
    });
  }
  
  cancelarBoleto() {
    if (!this.detalhesTitulo || this.detalhesTitulo.length === 0) {
      return;
    }

    const item = this.detalhesTitulo[0];

    if (this.totalSaldo <= 0) {
      this.poNotification.warning('Não é possível cancelar um título que não possui saldo.');
      return;
    }

    if (item.transf === 'S' && item.borapi == 'S') {

      // Monta a variável conforme solicitado: prefixo + numtit + parcela + tipo
      const chaveBoleto = `${item.prefixo}${item.numtit}${item.parcela}`;

      this.poDialog.confirm({
        title: 'Confirmar Cancelamento',
        message: `Deseja realmente solicitar o cancelamento do Boleto ${item.numtit}/${item.prefixo}, parcela ${item.parcela} ?`,
        confirm: () => {
          this.protheusService.solCancela({ boleto: chaveBoleto }).subscribe({
            next: () => {
              this.poNotification.success('Cancelamento solicitado com sucesso!');
              this.detalhesModal.close();
              this.loadMonitor(); // Atualiza a grid principal
            },
            error: (err) => {
              this.poNotification.error('Erro ao solicitar o cancelamento do boleto.');
              console.error('Erro no cancelamento:', err);
            }
          });
        }
      });
    } else {
      this.poNotification.error('Titulo nao transmitido, por isso nao sera possivel cancelar.');
    }
  }
  /**
   * Tenta corrigir caracteres especiais que foram mal interpretados devido a problemas de codificação.
   * Este método é um workaround comum para strings UTF-8 que foram lidas como Latin-1 (ISO-8859-1).
   * @param text A string com os caracteres potencialmente mal interpretados.
   * @returns A string com os caracteres corrigidos, ou a original em caso de erro na decodificação.
   */
  private decodeSpecialCharacters(text: string): string {
    if (!text) {
      return '';
    }
    try {
      return decodeURIComponent(escape(text));
    } catch (e) {
      console.warn('Falha ao decodificar caracteres especiais, retornando texto original:', text, e);
      return text;
    }
  }

  atualizarPedidos(){
    this.titulos = [];
    this.loadMonitor();
  }

  calcularIndicadores() {
    // this.total = this.titulos.length;
    this.total = this.titulos.filter(p => p.oper === 'Transm. Padrao').length;
    // Exemplo de cálculo, ajuste para a sua estrutura de dados
    this.erros = this.titulos.filter(p => p.transf === 'F').length;
    this.registrar = this.titulos.filter(p => p.transf === '').length;
    this.email = this.titulos.filter(p => p.email != '1' && p.email !='').length;
    this.cancela = this.titulos.filter(p => p.oper === 'Cancelamento').length;
    this.altera = this.titulos.filter(p => p.oper === 'Alteracao').length;
  }
onShowMore2() {
  this.page++;
  this.loadMonitor();
  }
}
