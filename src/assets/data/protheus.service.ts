import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces para tipagem dos dados (opcional, mas recomendado)
export interface Bordero {
  ea_filial : string;
  ea_prefixo: string;
  ea_num    : string;
  ea_parcela: string;
  ea_tipo   : string;
  ea_numbor : string;
  emissao   : string;
  transf    : string;
  email     : string;
}

export interface Cargas {
  codfil    : string;
  filial    : string;
  carga     : string;
  destino   : string;
  motora    : string;
  emissao   : string;
  entrega   : string;
  transm    : string;
  qtdboleto : number;
  tipo      : string;
  nomecli   : string
}

export interface Pendencia {
  bordero: string;
  numtit : string;
  prefixo: string;
  parcela: string;
  emissao: string;
  transf : string;
  email  : string;
  obs    : string;
  baixa  : string;
  tipo   : string;
  nomecli: string;
  oper   : string
}

export interface Pedidos {
  ea_filial : string;
  ea_prefixo: string;
  ea_num    : string;
  ea_parcela: string;
  ea_tipo   : string;
  ea_numbor : string;
  pedido    : string;
  cliente   : string;
  nome      : string;
  status    : string
}

export interface Detalhe {
  bordero : string;
  numtit  : string;
  prefixo : string;
  codcli  : string;
  nome    : string;
  parcela : string;
  emissao : string;
  dtbaixa : string;
  vlreal  : number;
  vlbaixa : number;
  saldo   : number;
  desc    : string;
  dtvenc  : string;
  transf  : string;
  borapi  : string;
  forma  : string
}

export interface Titulo {
  id  : number;
  numtit  : string;
  prefixo : string;
  codcli  : string;
  nome    : string;
  parcela : string;
  emissao : string;
  vlreal  : number;
  saldo   : number;
  dtvenc  : string;
  tipo    : string
}

@Injectable({
  providedIn: 'root'
})
export class ProtheusService {
  // TODO: Substitua pela URL base da sua API Protheus
  private readonly API_URL = '/bolepix';
  private readonly API_FIN = '/boletos/Downloads'; //Customizada
  private readonly API_OFC = '/api/gfin/v1/Banks/Bills/Downloads'; //Oficial do Gestor Financeiro
  private readonly API_ECM = '/ecommerce';

  constructor(private http: HttpClient) { }

  getCargas(inicio: string, fim: string): Observable<Cargas[]> {
    return this.http.get<Cargas[]>(`${this.API_URL}/carga/${inicio}/${fim}`);
  }

  getBordero(inicio: string, fim: string,doc: string,page: number, pagesize: number): Observable<Bordero[]> {
    return this.http.get<Bordero[]>(`${this.API_URL}/bordero/${inicio}/${fim}/${doc}?page=${page}&pagesize=${pagesize}`);
  }

  getMonitor(inicio: string, fim: string,doc: string,page: number, pagesize: number): Observable<Pendencia[]> {
    return this.http.get<Pendencia[]>(`${this.API_URL}/monitor/${inicio}/${fim}/${doc}?page=${page}&pagesize=${pagesize}`);
  }

  getDetalhe(numero: string, prefixo: string, parcela :string): Observable<Detalhe[]> {
    return this.http.get<Detalhe[]>(`${this.API_URL}/detalhe/${numero}/${prefixo}/${parcela}`);
  }

  getPedCar(carga: string,codfil: string): Observable<Pedidos[]> {
    return this.http.get<Pedidos[]>(`${this.API_URL}/pedido/${carga}/${codfil}`);
  }
  
  solTransmis(carga: any): Observable<any> {
    return this.http.post(`${this.API_URL}/transmitir`, carga);
  }

  impressao(bordero: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/octet-stream'
    });

    return this.http.post(`${this.API_OFC}`, bordero, { headers, responseType: 'blob' });
  }
  
  solCancela(boleto: any): Observable<any> {
    return this.http.post(`${this.API_URL}/cancelar`, boleto);
  }
  getTitulo(inicio: string, fim: string,doc: string): Observable<Titulo[]> {
    return this.http.get<Titulo[]>(`${this.API_URL}/titulo/${inicio}/${fim}/${doc}`);
  }

  solBorder(carga: any): Observable<any> {
    return this.http.post(`${this.API_URL}/geraborde`, carga);
  }
}
