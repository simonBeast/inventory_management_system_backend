const { Op } = require('sequelize');
class Filter {
  constructor(model, queryString,includes = []) {
    this.model = model;
    this.queryString = queryString;
    this.query = {
      where: {},
      order: [],
      attributes: [],
      include:[]
    };
    this.includes = includes;
    this.page = parseInt(queryString.page, 10) || 1;
    this.limit = parseInt(queryString.limit, 10) || 10;
  }
  filter() {
    const queryObject = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObject[el]);
    Object.keys(queryObject).forEach(key => {
      const field = key;
      const operator = this._convertOperator(Object.keys(queryObject[key])[0]);
      const value = this._parseValue(Object.values(queryObject[key])[0]);
     if(Object.keys(queryObject[key])[0] == 'like' || Object.keys(queryObject[key])[0] == 'search'){
        this.query.where[field] = { [operator]: `${value}%`};
      }
      else{
        this.query.where[field] = { [operator]: value };
      } 
    });
   
    return this;
  }
  _parseValue(value) {
    return isNaN(value) ? value : Number(value);
  }

  // Helper function to convert operators to Sequelize format using Op
  _convertOperator(op) {
    switch (op) {
      case 'gt': return Op.gt;
      case 'lt': return Op.lt;
      case 'gte': return Op.gte;
      case 'lte': return Op.lte;
      case 'eq': return Op.eq;
      case 'neq': return Op.ne;
      case 'like': return Op.like;
      case 'search' : return Op.like;
      default: return Op.eq;
    }
  }
  async build() {
    const totalItems = await this.model.count({ where: this.query.where });
    const rows = await this.model.findAll(this.query);
    return {
      rows,
      totalItems,
      limit: this.limit,
      page: this.page
    };
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').map(field => {
        let order = 'ASC'; 
        if (field.charAt(0) === '-') {
          field = field.substring(1);
          order = 'DESC';
        }
        return [field, order];
      });
      this.query.order = sortBy;
    }
    else {
      this.query.order = [['createdAt', 'DESC']];
    }

    return this;
  }
  limitFields() {
    let selectedFields = this.queryString["fields"];
    if (this.queryString["fields"]) {
      selectedFields = selectedFields.split(',').map(field => `${field.trim()}`);
      this.query.attributes = selectedFields;
    }
    else {
      this.query.attributes = {
        exclude: [ 'updatedAt', 'deletedAt']
      }
    }
    return this;
  }
  paginate() {
    const offset = (this.page - 1) * this.limit;
    this.query.limit = this.limit;
    this.query.offset = offset;

    return this;
  }
  include() {
    if (this.includes.length) {
      this.includes.forEach(include => {
        this.query.include.push({
          model: include.model,
          as: include.as,
          attributes: include.attributes,
          where: include.where,
          required: include.required,
          separate:include.separate || false
        });
      });
    }
    return this;
  }
}
module.exports = Filter;