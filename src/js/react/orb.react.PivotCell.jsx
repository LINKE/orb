/** @jsx React.DOM */

/* global module, require, React */

'use strict';

module.exports.PivotCell = react.createClass({
  expand: function() {
    this.props.pivotTableComp.expandRow(this.props.cell);
  },
  collapse: function() {
    this.props.pivotTableComp.collapseRow(this.props.cell);
  },
  render: function() {
    var self = this;
    var cell = this.props.cell;
    var divcontent = [];
    var value;
    var vArrow = '\u25bc';
    var hArrow = '\u25b6';
    var cellClick;
    var headerPushed = false;

    switch(cell.template) {
      case 'cell-template-row-header':
      case 'cell-template-column-header':
        var isWrapper = cell.type === uiheaders.HeaderType.WRAPPER && cell.dim.field.subTotal.visible && cell.dim.field.subTotal.collapsible && cell.subtotalHeader.expanded;
        var isSubtotal = cell.type === uiheaders.HeaderType.SUB_TOTAL && !cell.expanded;
        if(isWrapper || isSubtotal) {
          headerPushed = true;

          divcontent.push(<table key="header-value">
            <tbody>
            <tr><td className="tgl-btn"><div className={'tgl-btn-' + (isWrapper ? 'down' : 'right')} onClick={(isWrapper ? this.collapse : this.expand)}></div></td>
            <td className="hdr-val"><div>{cell.value}</div></td></tr>
            </tbody></table>);
        }
        value = cell.value;
        break;
      case 'cell-template-dataheader':
        value = cell.value.caption;
        break;
      case 'cell-template-datavalue':
        value = (cell.datafield && cell.datafield.formatFunc) ? cell.datafield.formatFunc()(cell.value) : cell.value;
        cellClick = function() {
          self.props.pivotTableComp.pgridwidget.drilldown(cell, self.props.pivotTableComp.id);
        }
        break;
      default:
        break;
    }

    if(!headerPushed) {
      divcontent.push(<div key="cell-value" className={cell.template !== 'cell-template-datavalue' ? 'hdr-val' : ''}><div>{value}</div></div>);
    }

    var classname = cell.cssclass;
    var isHidden = !cell.visible();
      
    if(isHidden) {
      classname += ' cell-hidden';
    }

    if(this.props.topmost && cell.template !== 'cell-template-empty') {
      classname += ' cell-topmost';
    }

    if(this.props.rightmost && (cell.axetype !== axe.Type.COLUMNS || cell.type === uiheaders.HeaderType.GRAND_TOTAL)) {
      classname += ' cell-rightmost';
    }

    if((this.props.leftmost && cell.template !== 'cell-template-empty') || this.props.leftmostheader || this.props.leftmostdatavalue) {
      classname += ' cell-leftmost';
    }

    if(cell.template === 'cell-template-column-header' || cell.template === 'cell-template-dataheader') {
      classname += ' cntr';
    }

    return <td className={classname} onDoubleClick={ cellClick }
               colSpan={cell.hspan() + (this.props.leftmost ? extraCol : 0)}
               rowSpan={cell.vspan()}>
                <div>
                  {divcontent}
                </div>
           </td>;
  }
});