import pandas as pd

def carregar_dados():
    """Carrega os dados de culturas, talhões e regras dos arquivos CSV"""
    culturas = pd.read_csv("data/culturas.csv")
    talhoes = pd.read_csv("data/talhoes.csv")
    regras = pd.read_csv("data/regras_culturas.csv")
    return culturas, talhoes, regras
