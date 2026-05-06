from flask import Flask, render_template, jsonify
import requests

app = Flask(__name__)

def fetch_countries():
    try:
        url = "https://restcountries.com/v3.1/all?fields=name,region,subregion,flags,population,area,capital,cca3"
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Erro ao buscar países: {e}")
        return []

def build_tree(countries):
    tree = {}
    for country in countries:
        continent = country.get('region') or 'Unknown'
        region    = country.get('subregion') or f"{continent} — Outros"

        tree.setdefault(continent, {}).setdefault(region, []).append({
            'name':       (country.get('name') or {}).get('common', 'N/A'),
            'flag':       (country.get('flags') or {}).get('svg') or (country.get('flags') or {}).get('png', ''),
            'capital':    (country.get('capital') or ['N/A'])[0],
            'population': country.get('population', 0),
            'area':       country.get('area', 0),
            'cca3':       country.get('cca3', ''),
        })

    sorted_tree = {}
    for continent in sorted(tree):
        sorted_tree[continent] = {}
        for region in sorted(tree[continent]):
            sorted_tree[continent][region] = sorted(tree[continent][region], key=lambda x: x['name'])
    return sorted_tree

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tree')
def get_tree():
    countries = fetch_countries()
    if not countries:
        return jsonify({'error': 'Falha ao buscar países'}), 500
    return jsonify(build_tree(countries))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
